import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

export interface RunningApp {
  url: string;
  /** Combined stdout+stderr of the server process, for log-leak checks. */
  logs: () => string;
  stop: () => Promise<void>;
}

const ROOT = path.resolve(import.meta.dirname, "../..");

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address() as { port: number };
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });
}

/** Starts the already-built app (`npm run build` first) with the given env. FIXFRAME_START_CMD overrides the command. */
export async function startApp(env: Record<string, string>): Promise<RunningApp> {
  const port = await freePort();
  const cmd = process.env.FIXFRAME_START_CMD ?? "npm run start";
  let out = "";
  const child: ChildProcess = spawn(cmd, {
    cwd: ROOT,
    shell: true,
    env: { ...process.env, META_API_TOKEN: "", META_API_BASE_URL: "", ...env, PORT: String(port) },
  });
  child.stdout?.on("data", (d) => (out += d));
  child.stderr?.on("data", (d) => (out += d));
  let exited = false;
  child.on("exit", () => (exited = true));

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 60_000;
  for (;;) {
    if (exited) throw new Error(`app exited before becoming ready:\n${out}`);
    try {
      await fetch(url);
      break;
    } catch {
      if (Date.now() > deadline) throw new Error(`app not ready after 60s:\n${out}`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return {
    url,
    logs: () => out,
    stop: () =>
      new Promise((resolve) => {
        if (exited) return resolve();
        child.on("exit", () => resolve());
        // shell:true wraps npm; on Windows kill the whole tree.
        if (process.platform === "win32" && child.pid) spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
        else child.kill("SIGTERM");
      }),
  };
}

export async function post(app: RunningApp, route: "segment" | "extract", body: unknown) {
  const res = await fetch(`${app.url}/api/${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, text, json };
}
