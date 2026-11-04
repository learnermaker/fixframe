// Acceptance A9, A10, A11 (negative half): live mode must fail loudly, never fall back to fixtures.
// Upstream is a local fake that only misbehaves, so this proves failure handling, NOT live compatibility.
import { afterAll, describe, expect, it } from "vitest";
import { startApp, post } from "../support/app";
import { startFakeMeta, type UpstreamMode } from "../support/fake-meta";
import { SENTINEL_TOKEN } from "../support/constants";

const ROUTES = [
  ["segment", { scenarioId: "water-ingress-01", prompt: "discoloured ceiling tile" }],
  ["extract", { scenarioId: "water-ingress-01" }],
] as const;

function expectLoudFailure(r: Awaited<ReturnType<typeof post>>, code: string) {
  expect(r.json?.ok, r.text).toBe(false);
  expect(r.json.error.code).toBe(code);
  expect(r.json.segmentation).toBeUndefined();
  expect(r.json.issue).toBeUndefined();
  expect(r.text).not.toMatch(/DEMO_FIXTURE|LIVE_META/); // neither hidden fallback nor fake live
  expect(r.text).not.toContain(SENTINEL_TOKEN);
}

describe("live mode without credentials", () => {
  it.each(ROUTES)("%s -> UNCONFIGURED", async (route, body) => {
    const app = await startApp({ FIXFRAME_PROVIDER_MODE: "live" });
    try { expectLoudFailure(await post(app, route, body), "UNCONFIGURED"); } finally { await app.stop(); }
  });
});

const cases: [UpstreamMode, string, number][] = [
  ["malformed-json-shape", "INVALID_RESPONSE", 120_000],
  ["not-json", "INVALID_RESPONSE", 120_000],
  ["http-500", "UPSTREAM_ERROR", 120_000],
  ["http-429", "RATE_LIMITED", 120_000],
  // The timeout budget is owned by Workstream B; this ceiling only keeps the test from hanging forever.
  ["hang", "TIMEOUT", 300_000],
];

describe.each(cases)("live mode, upstream %s", (mode, code, limit) => {
  const fake = startFakeMeta(mode);
  afterAll(async () => (await fake).close());

  it.each(ROUTES)(`%s -> ${code}`, async (route, body) => {
    const up = await fake;
    const app = await startApp({ FIXFRAME_PROVIDER_MODE: "live", META_API_TOKEN: SENTINEL_TOKEN, META_API_BASE_URL: up.url });
    try {
      expectLoudFailure(await post(app, route, body), code);
      expect(up.hits(), "route never reached the (fake) upstream").toBeGreaterThan(0);
      expect(app.logs()).not.toContain(SENTINEL_TOKEN);
    } finally { await app.stop(); }
  }, limit);
});
