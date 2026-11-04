import { createServer, type Server } from "node:http";

export type UpstreamMode = "malformed-json-shape" | "not-json" | "http-500" | "http-429" | "hang";

export interface FakeMeta { url: string; hits: () => number; close: () => Promise<void> }

/**
 * Stand-in for the Meta API that only ever misbehaves. It is format-agnostic on purpose:
 * it does not claim to know the real SAM / Muse Spark payloads, so it can only drive failure paths.
 */
export async function startFakeMeta(mode: UpstreamMode): Promise<FakeMeta> {
  let hits = 0;
  const sockets = new Set<import("node:net").Socket>();
  const server: Server = createServer((req, res) => {
    hits++;
    req.resume();
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
    hits: () => hits,
    close: () => new Promise((r) => { sockets.forEach((s) => s.destroy()); server.close(() => r()); }),
  };
}
