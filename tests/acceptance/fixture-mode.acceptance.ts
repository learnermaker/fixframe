// Acceptance A1, A3, A4 + provenance: explicit fixture mode, no credentials.
// Responses are validated against Workstream C's canonical schemas (ADR 0001), not copies of them.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startApp, post, type RunningApp } from "../support/app";
import { ERROR_CODES, SCENARIOS } from "../support/constants";
import { ExtractResponseSchema, SegmentResponseSchema } from "../../src/lib/contracts";

let app: RunningApp;
beforeAll(async () => { app = await startApp({ FIXFRAME_PROVIDER_MODE: "fixture" }); });
afterAll(async () => { await app?.stop(); });

describe.each(SCENARIOS)("fixture mode: $id", (s) => {
  it("POST /api/segment returns a canonical, explicitly-fixture segmentation", async () => {
    const r = await post(app, "segment", { scenarioId: s.id, prompt: s.segmentationPrompt });
    const parsed = SegmentResponseSchema.parse(r.json);
    if (!parsed.ok) throw new Error(r.text);
    expect(parsed.segmentation.provenance).toMatchObject({ source: "DEMO_FIXTURE", provider: "fixture", operation: "segmentation" });
    expect(parsed.segmentation.provenance.fixtureId).toEqual(expect.any(String));
    expect(r.text).not.toMatch(/LIVE_META/);
  });

  it("POST /api/extract returns a canonical, unconfirmed issue that keeps catalog identifiers and unknowns", async () => {
    const r = await post(app, "extract", { scenarioId: s.id });
    const parsed = ExtractResponseSchema.parse(r.json);
    if (!parsed.ok) throw new Error(r.text);
    const { issue } = parsed;
    expect(issue.scenarioId).toBe(s.id);
    expect(issue.status).toBe("needs_review"); // never pre-confirmed / pre-converted
    expect(issue.location).toBe(s.area);
    expect(issue.assetLabel).toBe(s.assetLabel);
    expect(issue.unknowns.length).toBeGreaterThan(0);
    expect(issue.evidence.length).toBeGreaterThan(0);
    expect(issue.confidence ?? null).toBeNull();
    expect(issue.provenance.length).toBeGreaterThan(0);
    for (const p of issue.provenance) expect(p.source).toBe("DEMO_FIXTURE");
    expect(r.text).not.toMatch(/LIVE_META/);
  });
});

describe("fixture mode: input validation", () => {
  it.each(["segment", "extract"] as const)("%s rejects an unknown scenario with a canonical error", async (route) => {
    const r = await post(app, route, { scenarioId: "does-not-exist", prompt: "x" });
    const parsed = (route === "segment" ? SegmentResponseSchema : ExtractResponseSchema).parse(r.json);
    expect(parsed.ok, r.text).toBe(false);
    if (!parsed.ok) expect(ERROR_CODES).toContain(parsed.error.code);
  });

  it.each(["segment", "extract"] as const)("%s rejects a malformed request body", async (route) => {
    for (const body of ["not json", "{}", JSON.stringify({ scenarioId: 42 })]) {
      const r = await post(app, route, body);
      expect(r.json?.ok, `${route} ${body}: ${r.text}`).toBe(false);
      expect(r.status).toBeGreaterThanOrEqual(400);
    }
  });
});
