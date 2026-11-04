// Acceptance A9, A10, A11 (negative half): live mode must fail loudly, never fall back to fixtures.
// Upstream is a local mock, so this proves failure handling of the real routes, NOT compatibility with the real Meta API.
import { afterAll, describe, expect, it } from "vitest";
import { startApp, post } from "../support/app";
import { startFakeMeta, type UpstreamMode } from "../support/fake-meta";
import { SENTINEL_TOKEN } from "../support/constants";

const ROUTES = [
  ["segment", { scenarioId: "water-ingress-01", prompt: "discoloured ceiling tile" }],
  ["extract", { scenarioId: "water-ingress-01" }],
] as const;

// HTTP status per error code, as implemented in src/server/providers/route.ts (HTTP_STATUS).
const STATUS: Record<string, number> = { UNCONFIGURED: 503, TIMEOUT: 504, RATE_LIMITED: 429, UPSTREAM_ERROR: 502, INVALID_RESPONSE: 502 };

function expectLoudFailure(r: Awaited<ReturnType<typeof post>>, code: string) {
  expect(r.json?.ok, r.text).toBe(false);
  expect(r.json.error.code).toBe(code);
  expect(r.status).toBe(STATUS[code]);
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

  it("unset FIXFRAME_PROVIDER_MODE is live (fixtures need an explicit opt-in), not fixture", async () => {
    const app = await startApp({ FIXFRAME_PROVIDER_MODE: "" });
    try { expectLoudFailure(await post(app, "extract", ROUTES[1][1]), "UNCONFIGURED"); } finally { await app.stop(); }
  });
});

const cases: [UpstreamMode, string][] = [
  ["malformed-json-shape", "INVALID_RESPONSE"],
  ["not-json", "INVALID_RESPONSE"],
  ["http-500", "UPSTREAM_ERROR"],
  ["http-429", "RATE_LIMITED"],
];

describe.each(cases)("live mode, upstream %s", (mode, code) => {
  const fake = startFakeMeta(mode);
  afterAll(async () => (await fake).close());

  it.each(ROUTES)(`%s -> ${code}`, async (route, body) => {
    const up = await fake;
    const app = await startApp({ FIXFRAME_PROVIDER_MODE: "live", META_API_TOKEN: SENTINEL_TOKEN, META_API_BASE_URL: up.url });
    try {
      expectLoudFailure(await post(app, route, body), code);
      expect(up.hits(), "route never reached the (mock) upstream").toBeGreaterThan(0);
      expect(app.logs()).not.toContain(SENTINEL_TOKEN);
    } finally { await app.stop(); }
  });
});

// The app's upstream budget is a fixed 60 s (metaClient.ts TIMEOUT_MS), so these are the slowest tests; run both routes concurrently.
describe("live mode, upstream never answers", () => {
  const fake = startFakeMeta("hang");
  afterAll(async () => (await fake).close());

  it.concurrent.each(ROUTES)("%s -> TIMEOUT (~60 s)", async (route, body) => {
    const up = await fake;
    const app = await startApp({ FIXFRAME_PROVIDER_MODE: "live", META_API_TOKEN: SENTINEL_TOKEN, META_API_BASE_URL: up.url });
    try {
      expectLoudFailure(await post(app, route, body), "TIMEOUT");
      expect(app.logs()).not.toContain(SENTINEL_TOKEN);
    } finally { await app.stop(); }
  }, 150_000);
});
