// Acceptance A1, A3, A4 + provenance: explicit fixture mode, no credentials.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startApp, post, type RunningApp } from "../support/app";
import { ERROR_CODES, SCENARIOS } from "../support/constants";

let app: RunningApp;
beforeAll(async () => { app = await startApp({ FIXFRAME_PROVIDER_MODE: "fixture" }); });
afterAll(async () => { await app?.stop(); });

describe.each(SCENARIOS)("fixture mode: $id", (s) => {
  it("POST /api/segment returns a stable, explicitly-fixture segmentation", async () => {
    const r = await post(app, "segment", { scenarioId: s.id, prompt: "region of interest" });
    expect(r.json?.ok, r.text).toBe(true);
    const seg = r.json.segmentation;
    expect(seg.provenance).toMatchObject({ source: "DEMO_FIXTURE", provider: "fixture", operation: "segmentation" });
    expect(typeof seg.provenance.fixtureId).toBe("string");
    expect(Number.isNaN(Date.parse(seg.provenance.createdAt))).toBe(false);
    expect(seg.imageWidth).toBeGreaterThan(0);
    expect(seg.imageHeight).toBeGreaterThan(0);
    expect(r.text).not.toMatch(/LIVE_META/);
  });

  it("POST /api/extract returns an unconfirmed issue that keeps catalog identifiers and unknowns", async () => {
    const r = await post(app, "extract", { scenarioId: s.id });
    expect(r.json?.ok, r.text).toBe(true);
    const issue = r.json.issue;
    expect(issue.scenarioId).toBe(s.id);
    expect(issue.status).toBe("needs_review"); // never pre-confirmed / pre-converted
    expect(issue.location).toBe(s.location);
    expect(issue.assetLabel).toBe(s.assetLabel);
    expect(issue.unknowns.length).toBeGreaterThan(0);
    expect(issue.confidence ?? null).toBeNull(); // no uncalibrated numeric confidence
    expect(issue.provenance.length).toBeGreaterThan(0);
    for (const p of issue.provenance) expect(p.source).toBe("DEMO_FIXTURE");
    expect(r.text).not.toMatch(/LIVE_META/);
  });
});

describe("fixture mode: input validation", () => {
  it.each(["segment", "extract"] as const)("%s rejects an unknown scenario with a structured error", async (route) => {
    const r = await post(app, route, { scenarioId: "does-not-exist", prompt: "x" });
    expect(r.json?.ok, r.text).toBe(false);
    expect(ERROR_CODES).toContain(r.json.error.code);
    expect(r.json.error.message).toEqual(expect.any(String));
  });

  it.each(["segment", "extract"] as const)("%s rejects a malformed request body", async (route) => {
    for (const body of ["not json", "{}", JSON.stringify({ scenarioId: 42 })]) {
      const r = await post(app, route, body);
      expect(r.json?.ok, `${route} ${body}: ${r.text}`).toBe(false);
      expect(r.status).toBeGreaterThanOrEqual(400);
    }
  });
});
