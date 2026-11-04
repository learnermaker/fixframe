// MANUAL live smoke test against the real Meta Model API. Never run in CI; needs a real key and makes 3 real calls
// (1 SAM, 1 Muse Spark, 1 deliberately-bad key). Usage (key via environment only, never a file):
//   FIXFRAME_LIVE_KEY=<your key> npm run live-smoke --prefix tests     (after `npm run build` in the repo root)
// Passing = a result on this date for these cases only. It says nothing about accuracy, safety or other scenarios.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startApp, post, type RunningApp } from "../support/app";
import { BYOK_HEADER, SCENARIOS } from "../support/constants";
import { ExtractResponseSchema, SegmentResponseSchema } from "../../src/lib/contracts";

const KEY = process.env.FIXFRAME_LIVE_KEY;
const scenario = SCENARIOS[0]!; // water-ingress-01
let app: RunningApp;

beforeAll(async () => {
  if (!KEY) throw new Error("Set FIXFRAME_LIVE_KEY to a real Meta API key to run the live smoke test.");
  // No deployment key on purpose: this exercises the BYOK path (ADR 0002) end to end.
  app = await startApp({ FIXFRAME_PROVIDER_MODE: "live", META_API_TOKEN: "", META_API_BASE_URL: "" });
});
afterAll(async () => { await app?.stop(); });

describe("live Meta smoke test", () => {
  it("SAM 3.1: segmentation of the synthetic ceiling image is LIVE_META and decodes to a canonical result", async () => {
    const t = Date.now();
    const r = await post(app, "segment", { scenarioId: scenario.id, prompt: scenario.segmentationPrompt }, { [BYOK_HEADER]: KEY! });
    const parsed = SegmentResponseSchema.parse(r.json);
    if (!parsed.ok) throw new Error(`${r.status} ${parsed.error.code}: ${parsed.error.message}`);
    const { segmentation: s } = parsed;
    console.log(`SAM: HTTP ${r.status}, ${Date.now() - t} ms, boxes=${s.boxes.length}, mask=${s.mask.format}, requestId=${s.provenance.requestId ? "present" : "absent"}`);
    expect(s.provenance).toMatchObject({ source: "LIVE_META", provider: "meta", model: "sam-3.1", operation: "segmentation" });
    expect(s.boxes.length).toBeGreaterThan(0);
    expect(r.text).not.toContain(KEY!);
  }, 180_000);

  it("Muse Spark 1.3: extraction is LIVE_META, needs_review, and keeps trusted catalog identifiers", async () => {
    const t = Date.now();
    const r = await post(app, "extract", { scenarioId: scenario.id }, { [BYOK_HEADER]: KEY! });
    const parsed = ExtractResponseSchema.parse(r.json);
    if (!parsed.ok) throw new Error(`${r.status} ${parsed.error.code}: ${parsed.error.message}`);
    const { issue } = parsed;
    console.log(`Muse: HTTP ${r.status}, ${Date.now() - t} ms, evidence=${issue.evidence.length}, unknowns=${issue.unknowns.length}, requestId=${issue.provenance[0]?.requestId ? "present" : "absent"}`);
    expect(issue.provenance[0]).toMatchObject({ source: "LIVE_META", provider: "meta", model: "muse-spark-1.3", operation: "extraction" });
    expect(issue.status).toBe("needs_review");
    expect(issue.location).toBe(scenario.area);
    expect(issue.assetLabel).toBe(scenario.assetLabel);
    expect(issue.unknowns.length).toBeGreaterThan(0);
    expect(r.text).not.toContain(KEY!);
  }, 180_000);

  it("a bad key is rejected by the real Meta API and surfaces as an error: no fixture, no fallback", async () => {
    const r = await post(app, "extract", { scenarioId: scenario.id }, { [BYOK_HEADER]: "FF_SENTINEL_BYOK_not-a-real-key" });
    console.log(`Bad key: HTTP ${r.status}, code=${r.json?.error?.code}`);
    expect(r.json?.ok, r.text).toBe(false);
    expect(r.json.error.code).toBe("UPSTREAM_ERROR");
    expect(r.text).not.toMatch(/DEMO_FIXTURE|LIVE_META/);
  }, 180_000);

  it("the key is absent from server logs", () => {
    expect(app.logs()).not.toContain(KEY!);
  });
});
