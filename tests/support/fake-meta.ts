import { createServer, type Server } from "node:http";

// Failure modes plus a few well-formed ones. All are MOCKS of the documented `POST /v1/responses` envelope
// (src/server/providers/metaClient.ts); none of them is evidence about the real Meta API.
export type UpstreamMode =
  | "malformed-json-shape" | "not-json" | "http-500" | "http-429" | "hang"
  | "http-400" | "http-413" | "http-408" | "http-504"
  | "muse-unsafe-evidence" // extraction: clean title/description, but the evidence text states the area is safe
  | "muse-valid"      // extraction: well-formed issue; segmentation: unreadable text
  | "muse-overwrite"  // extraction: well-formed issue that also tries to set trusted fields
  | "muse-unsafe"     // extraction: issue that states a cause
  | "sam-empty";      // segmentation: completed, empty text ("nothing matched")

export interface FakeMeta {
  url: string;
  hits: () => number;
  /** Authorization header of every request received, in order. */
  auths: () => string[];
  /** Request path+query of every request received. */
  urls: () => string[];
  close: () => Promise<void>;
}

export const FAKE_REQUEST_ID = "req-fake-0001";

const envelope = (text: string) => ({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }] });

function museIssue(body: any, mode: UpstreamMode) {
  // The app pins evidence to the transcript ref via the json_schema it sends; echo that ref back.
  const ref = body?.text?.format?.schema?.properties?.evidence?.items?.properties?.ref?.enum?.[0];
  const issue: Record<string, unknown> = {
    title: "Visible mark reported near the area",
    description: "A visible mark is described in the note. Its source is not known.",
    category: "building_fabric",
    urgency: "review",
    evidence: [{ kind: "transcript", ref, supports: "reported observation" }],
    unknowns: ["source of the mark", "hidden extent", "safety status"],
  };
  if (mode === "muse-unsafe") issue.description = "The patch is caused by a leaking pipe above.";
  if (mode === "muse-unsafe-evidence") (issue.evidence as { supports: string }[])[0]!.supports = "The area is safe to use.";
  if (mode === "muse-overwrite") Object.assign(issue, { location: "Attacker-chosen room", assetLabel: "FAKE-ASSET-99", scenarioId: "other", status: "completed", id: "evil" });
  return issue;
}

/**
 * Stand-in for the Meta API. Records which bearer credential arrived. `rejectKey`: that bearer value gets HTTP 401.
 */
export async function startFakeMeta(mode: UpstreamMode, opts: { rejectKey?: string; port?: number } = {}): Promise<FakeMeta> {
  const auths: string[] = [];
  const urls: string[] = [];
  const sockets = new Set<import("node:net").Socket>();
  const server: Server = createServer((req, res) => {
    auths.push(String(req.headers.authorization ?? ""));
    urls.push(req.url ?? "");
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (opts.rejectKey && req.headers.authorization === `Bearer ${opts.rejectKey}`) {
        res.writeHead(401, { "content-type": "application/json" });
        return void res.end('{"error":"invalid api key"}');
      }
      if (mode === "hang") return; // never answer
      if (mode === "http-500") { res.writeHead(500, { "content-type": "application/json" }); return void res.end('{"error":"boom"}'); }
      const plain = /^http-(400|413|408|504)$/.exec(mode);
      if (plain) { res.writeHead(Number(plain[1]), { "content-type": "application/json" }); return void res.end('{"error":"mock"}'); }
      if (mode === "http-429") { res.writeHead(429, { "retry-after": "1", "content-type": "application/json" }); return void res.end('{"error":"slow down"}'); }
      if (mode === "not-json") { res.writeHead(200, { "content-type": "text/html" }); return void res.end("<html>nope</html>"); }
      const json = (v: unknown) => { res.writeHead(200, { "content-type": "application/json", "x-request-id": FAKE_REQUEST_ID }); res.end(JSON.stringify(v)); };
      let body: any; try { body = JSON.parse(raw); } catch { body = undefined; }
      const isMuse = body?.model === "muse-spark-1.3";
      if (mode === "sam-empty") return json(envelope(""));
      if (mode.startsWith("muse-")) return json(envelope(isMuse ? JSON.stringify(museIssue(body, mode)) : "not a segmentation"));
      json({ unexpected: "shape", choices: null, masks: "not-an-array" }); // malformed-json-shape
    });
  });
  server.on("connection", (s) => { sockets.add(s); s.on("close", () => sockets.delete(s)); });
  await new Promise<void>((r) => server.listen(opts.port ?? 0, "127.0.0.1", r));
  const { port } = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${port}`,
    hits: () => auths.length,
    auths: () => [...auths],
    urls: () => [...urls],
    close: () => new Promise((r) => { sockets.forEach((s) => s.destroy()); server.close(() => r()); }),
  };
}
