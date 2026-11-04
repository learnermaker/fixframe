// Behaviour added by provider-hardening (PR #12): content-type gate, Meta status mapping, evidence safety scan,
// configurable upstream timeout. These pass only on a build that includes that PR. Upstream is a local mock.
import { describe, expect, it } from "vitest";
import { startApp, post } from "../support/app";
import { startFakeMeta, type UpstreamMode } from "../support/fake-meta";
import { SENTINEL_TOKEN } from "../support/constants";

const EXTRACT = { scenarioId: "water-ingress-01" };
const SEGMENT = { scenarioId: "water-ingress-01", prompt: "discoloured ceiling tile" };

async function live<T>(mode: UpstreamMode, fn: (app: Awaited<ReturnType<typeof startApp>>, up: Awaited<ReturnType<typeof startFakeMeta>>) => Promise<T>, extraEnv: Record<string, string> = {}) {
  const up = await startFakeMeta(mode);
  const app = await startApp({ FIXFRAME_PROVIDER_MODE: "live", META_API_TOKEN: SENTINEL_TOKEN, META_API_BASE_URL: up.url, ...extraEnv });
  try { return await fn(app, up); } finally { await app.stop(); await up.close(); }
}

describe("content-type gate", () => {
  it.each(["text/plain", "application/x-www-form-urlencoded", "text/plain;charset=UTF-8"])("%s with a valid JSON body -> 400 UNSUPPORTED_INPUT and the upstream is never called", (type) =>
    live("muse-valid", async (app, up) => {
      for (const [route, body] of [["extract", EXTRACT], ["segment", SEGMENT]] as const) {
        const r = await post(app, route, JSON.stringify(body), { "content-type": type });
        expect(r.status, r.text).toBe(400);
        expect(r.json.error.code).toBe("UNSUPPORTED_INPUT");
      }
      expect(up.hits()).toBe(0);
    }));

  it("application/json with a charset suffix is accepted", async () => {
    const app = await startApp({ FIXFRAME_PROVIDER_MODE: "fixture" });
    try {
      const r = await post(app, "extract", EXTRACT, { "content-type": "Application/JSON; charset=utf-8" });
      expect(r.json?.ok, r.text).toBe(true);
    } finally { await app.stop(); }
  });
});

describe("Meta HTTP status mapping", () => {
  it.each<[UpstreamMode, string, number]>([
    ["http-400", "UNSUPPORTED_INPUT", 400],
    ["http-413", "UNSUPPORTED_INPUT", 400],
    ["http-408", "TIMEOUT", 504],
    ["http-504", "TIMEOUT", 504],
  ])("upstream %s -> %s (HTTP %i), no fixture, no leak", (mode, code, status) =>
    live(mode, async (app) => {
      const r = await post(app, "extract", EXTRACT);
      expect(r.json?.error?.code, r.text).toBe(code);
      expect(r.status).toBe(status);
      expect(r.text).not.toMatch(/DEMO_FIXTURE|LIVE_META/);
      expect(r.text).not.toContain(SENTINEL_TOKEN);
      expect(app.logs()).not.toContain(SENTINEL_TOKEN);
    }));
});

describe("evidence safety scan", () => {
  it("evidence text that certifies safety -> SAFETY_REVIEW_REQUIRED (422), no issue", () =>
    live("muse-unsafe-evidence", async (app) => {
      const r = await post(app, "extract", EXTRACT);
      expect(r.json?.error?.code, r.text).toBe("SAFETY_REVIEW_REQUIRED");
      expect(r.status).toBe(422);
      expect(r.json.issue).toBeUndefined();
    }));
});

describe("META_API_TIMEOUT_MS", () => {
  // Invalid values fall back to the 60 s default; that path is not run here because it would take a minute.
  it("1000 ms is honoured: a silent upstream yields TIMEOUT well under the 60 s default", () =>
    live("hang", async (app) => {
      const t = Date.now();
      const r = await post(app, "extract", EXTRACT);
      expect(r.json?.error?.code, r.text).toBe("TIMEOUT");
      expect(Date.now() - t, "configured timeout was not honoured").toBeLessThan(30_000);
    }, { META_API_TIMEOUT_MS: "1000" }));
});
