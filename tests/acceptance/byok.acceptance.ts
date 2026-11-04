// ADR 0002 acceptance: bring-your-own Meta key, via the `X-FixFrame-Meta-Key` header on /api/segment and /api/extract.
// The upstream is a local fake that records which bearer credential arrived. It never returns a valid Meta payload
// (the real shape is Workstream B's to verify), so "returns normalized output" for a valid BYOK key is NOT covered here.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startApp, post, type RunningApp } from "../support/app";
import { startFakeMeta, type FakeMeta } from "../support/fake-meta";
import { BYOK_HEADER, ERROR_CODES, SENTINEL_BYOK, SENTINEL_TOKEN } from "../support/constants";

const BODY = {
  segment: { scenarioId: "water-ingress-01", prompt: "discoloured ceiling tile" },
  extract: { scenarioId: "water-ingress-01" },
} as const;
const ROUTES = ["segment", "extract"] as const;

/** One app + one fake upstream per scenario of deployment credentials. */
async function withApp<T>(opts: { deployKey?: string; rejectKey?: string; mode?: "live" | "fixture" }, fn: (app: RunningApp, up: FakeMeta) => Promise<T>) {
  const up = await startFakeMeta("malformed-json-shape", { rejectKey: opts.rejectKey });
  const app = await startApp({
    FIXFRAME_PROVIDER_MODE: opts.mode ?? "live",
    META_API_TOKEN: opts.deployKey ?? "",
    META_API_BASE_URL: up.url,
  });
  try { return await fn(app, up); } finally { await app.stop(); await up.close(); }
}

function expectNoLeak(text: string, ...secrets: string[]) {
  for (const s of secrets) expect(text).not.toContain(s);
}

describe.each(ROUTES)("BYOK on /api/%s", (route) => {
  it("no deployment key + no BYOK key -> UNCONFIGURED, upstream never called", () =>
    withApp({}, async (app, up) => {
      const r = await post(app, route, BODY[route]);
      expect(r.json?.error?.code, r.text).toBe("UNCONFIGURED");
      expect(up.hits()).toBe(0);
    }));

  it("no deployment key + BYOK key -> that key is forwarded upstream as the bearer credential", () =>
    withApp({}, async (app, up) => {
      const r = await post(app, route, BODY[route], { [BYOK_HEADER]: SENTINEL_BYOK });
      expect(r.json?.error?.code, r.text).not.toBe("UNCONFIGURED");
      expect(up.auths()).toContain(`Bearer ${SENTINEL_BYOK}`);
      expectNoLeak(r.text, SENTINEL_BYOK);
    }));

  it("deployment key + no BYOK key -> deployment key is used", () =>
    withApp({ deployKey: SENTINEL_TOKEN }, async (app, up) => {
      await post(app, route, BODY[route]);
      expect(up.auths()).toEqual([`Bearer ${SENTINEL_TOKEN}`]);
    }));

  it("both keys -> BYOK wins for that request only; the next request without it uses the deployment key", () =>
    withApp({ deployKey: SENTINEL_TOKEN }, async (app, up) => {
      await post(app, route, BODY[route], { [BYOK_HEADER]: SENTINEL_BYOK });
      await post(app, route, BODY[route]);
      expect(up.auths()).toEqual([`Bearer ${SENTINEL_BYOK}`, `Bearer ${SENTINEL_TOKEN}`]);
    }));

  it("blank / whitespace BYOK header is ignored (trimmed, non-empty rule) and does not suppress the deployment key", () =>
    withApp({ deployKey: SENTINEL_TOKEN }, async (app, up) => {
      await post(app, route, BODY[route], { [BYOK_HEADER]: "   " });
      expect(up.auths()).toEqual([`Bearer ${SENTINEL_TOKEN}`]);
    }));

  it("rejected BYOK key -> error; no retry with the deployment key; no fixture fallback; nothing leaks", () =>
    withApp({ deployKey: SENTINEL_TOKEN, rejectKey: SENTINEL_BYOK }, async (app, up) => {
      const r = await post(app, route, BODY[route], { [BYOK_HEADER]: SENTINEL_BYOK });
      expect(r.json?.ok, r.text).toBe(false);
      expect(ERROR_CODES).toContain(r.json.error.code);
      expect(r.json.error.code).not.toBe("UNCONFIGURED");
      expect(r.text).not.toMatch(/DEMO_FIXTURE|LIVE_META/);
      expect(up.auths().every((a) => a === `Bearer ${SENTINEL_BYOK}`), `upstream saw: ${up.auths()}`).toBe(true);
      expect(up.hits()).toBeGreaterThan(0);
      expectNoLeak(r.text, SENTINEL_BYOK, SENTINEL_TOKEN);
      expectNoLeak(app.logs(), SENTINEL_BYOK, SENTINEL_TOKEN);
    }));

  it("fixture mode stays explicit: neither credential is used or required", () =>
    withApp({ mode: "fixture", deployKey: SENTINEL_TOKEN }, async (app, up) => {
      const r = await post(app, route, BODY[route], { [BYOK_HEADER]: SENTINEL_BYOK });
      expect(r.json?.ok, r.text).toBe(true);
      expect(r.text).toMatch(/DEMO_FIXTURE/);
      expect(up.hits()).toBe(0);
      expectNoLeak(r.text, SENTINEL_BYOK, SENTINEL_TOKEN);
    }));

  it("BYOK key is absent from responses, logs and upstream URLs across failure modes", () =>
    withApp({}, async (app, up) => {
      const texts = [
        (await post(app, route, BODY[route], { [BYOK_HEADER]: SENTINEL_BYOK })).text,
        (await post(app, route, "not json", { [BYOK_HEADER]: SENTINEL_BYOK })).text,
        (await post(app, route, { scenarioId: "nope", prompt: "x" }, { [BYOK_HEADER]: SENTINEL_BYOK })).text,
      ];
      for (const t of texts) expectNoLeak(t, SENTINEL_BYOK);
      expectNoLeak(app.logs(), SENTINEL_BYOK);
      expectNoLeak(up.urls().join("\n"), SENTINEL_BYOK);
    }));
});

describe("BYOK and served pages", () => {
  let app: RunningApp;
  let up: FakeMeta;
  beforeAll(async () => {
    up = await startFakeMeta("http-500");
    app = await startApp({ FIXFRAME_PROVIDER_MODE: "live", META_API_BASE_URL: up.url });
  });
  afterAll(async () => { await app?.stop(); await up?.close(); });

  it("a BYOK request leaves no trace in HTML served afterwards (no server-side retention)", async () => {
    await post(app, "segment", BODY.segment, { [BYOK_HEADER]: SENTINEL_BYOK });
    const html = await (await fetch(app.url)).text();
    expect(html.length).toBeGreaterThan(0);
    expectNoLeak(html, SENTINEL_BYOK);
  });
});
