import { createServer, type Server } from "node:http";

export type UpstreamMode = "malformed-json-shape" | "not-json" | "http-500" | "http-429" | "hang";

export interface FakeMeta {
  url: string;
  hits: () => number;
  /** Authorization header of every request received, in order. */
  auths: () => string[];
  /** Request path+query of every request received. */
  urls: () => string[];
  close: () => Promise<void>;
}

/**
 * Stand-in for the Meta API that only ever misbehaves. It is format-agnostic on purpose:
 * it does not claim to know the real SAM / Muse Spark payloads, so it can only drive failure paths
 * and record which credential arrived. `rejectKey`: that bearer value gets HTTP 401 (a "rejected key").
 */
export async function startFakeMeta(mode: UpstreamMode, opts: { rejectKey?: string } = {}): Promise<FakeMeta> {
  const auths: string[] = [];
  const urls: string[] = [];
  const sockets = new Set<import("node:net").Socket>();
  const server: Server = createServer((req, res) => {
    auths.push(String(req.headers.authorization ?? ""));
    urls.push(req.url ?? "");
    req.resume();
    if (opts.rejectKey && req.headers.authorization === `Bearer ${opts.rejectKey}`) {
      res.writeHead(401, { "content-type": "application/json" });
      return void res.end('{"error":"invalid api key"}');
    }
    if (mode === "hang") return; // never answer
    if (mode === "http-500") { res.writeHead(500, { "content-type": "application/json" }); return void res.end('{"error":"boom"}'); }
    if (mode === "http-429") { res.writeHead(429, { "retry-after": "1", "content-type": "application/json" }); return void res.end('{"error":"slow down"}'); }
    if (mode === "not-json") { res.writeHead(200, { "content-type": "text/html" }); return void res.end("<html>nope</html>"); }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ unexpected: "shape", choices: null, masks: "not-an-array" }));
  });
  server.on("connection", (s) => { sockets.add(s); s.on("close", () => sockets.delete(s)); });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${port}`,
    hits: () => auths.length,
    auths: () => [...auths],
    urls: () => [...urls],
    close: () => new Promise((r) => { sockets.forEach((s) => s.destroy()); server.close(() => r()); }),
  };
}
