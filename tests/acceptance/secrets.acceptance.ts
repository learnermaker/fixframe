// Task 6: secrets must not reach client bundles, served pages, API responses or server logs.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startApp, post, type RunningApp } from "../support/app";
import { startFakeMeta, type FakeMeta } from "../support/fake-meta";
import { SENTINEL_TOKEN } from "../support/constants";

const ROOT = path.resolve(import.meta.dirname, "../..");
function* walk(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p); else yield p;
  }
}

describe("secrets", () => {
  let app: RunningApp;
  let fake: FakeMeta;
  beforeAll(async () => {
    fake = await startFakeMeta("http-500"); // forces the error/log path with the token set
    app = await startApp({ FIXFRAME_PROVIDER_MODE: "live", META_API_TOKEN: SENTINEL_TOKEN, META_API_BASE_URL: fake.url });
  });
  afterAll(async () => { await app?.stop(); await fake?.close(); });

  it("served HTML, JS chunks, API responses and server logs never contain the token", async () => {
    const html = await (await fetch(app.url)).text();
    const chunks = [...html.matchAll(/(?:src|href)="(\/_next\/[^"]+\.js[^"]*)"/g)].map((m) => m[1]!);
    expect(chunks.length, "no client JS chunks found in served HTML").toBeGreaterThan(0);
    for (const c of chunks) expect(await (await fetch(app.url + c)).text()).not.toContain(SENTINEL_TOKEN);
    expect(html).not.toContain(SENTINEL_TOKEN);
    for (const [route, body] of [["segment", { scenarioId: "water-ingress-01", prompt: "x" }], ["extract", { scenarioId: "water-ingress-01" }]] as const) {
      expect((await post(app, route, body)).text).not.toContain(SENTINEL_TOKEN);
    }
    expect(app.logs()).not.toContain(SENTINEL_TOKEN);
  });

  it("built client assets contain no token (CI builds with the sentinel in the environment)", () => {
    const dir = path.join(ROOT, ".next/static");
    expect(existsSync(dir), "run `npm run build` first").toBe(true);
    for (const f of walk(dir)) expect(readFileSync(f, "utf8"), f).not.toContain(SENTINEL_TOKEN);
  });

  it("no env file other than .env.example is tracked, and it holds no secret values or NEXT_PUBLIC_ credentials", () => {
    const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n");
    expect(tracked.filter((f) => /(^|\/)\.env(\..*)?$/.test(f) && !f.endsWith(".env.example"))).toEqual([]);
    const example = readFileSync(path.join(ROOT, ".env.example"), "utf8");
    expect(example).not.toMatch(/^NEXT_PUBLIC_\w*(TOKEN|KEY|SECRET)/m);
    expect(example).toMatch(/^META_API_TOKEN=\s*$/m);
  });
});
