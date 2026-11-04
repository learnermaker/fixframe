// Live-path normalisation against a MOCK upstream that speaks the documented Responses envelope.
// This checks what the real routes do with well-formed and hostile upstream payloads. It is NOT live Meta verification:
// a real SAM/Muse call has not been made by this suite. SAM success decoding (real mask payloads) is not covered here.
import { describe, expect, it } from "vitest";
import { startApp, post } from "../support/app";
import { FAKE_REQUEST_ID, startFakeMeta, type UpstreamMode } from "../support/fake-meta";
import { BYOK_HEADER, SCENARIOS, SENTINEL_BYOK, SENTINEL_TOKEN } from "../support/constants";
import { ExtractResponseSchema, SegmentResponseSchema } from "../../src/lib/contracts";

async function run<T>(mode: UpstreamMode, fn: (app: Awaited<ReturnType<typeof startApp>>, up: Awaited<ReturnType<typeof startFakeMeta>>) => Promise<T>) {
  const up = await startFakeMeta(mode);
  const app = await startApp({ FIXFRAME_PROVIDER_MODE: "live", META_API_TOKEN: SENTINEL_TOKEN, META_API_BASE_URL: up.url });
  try { return await fn(app, up); } finally { await app.stop(); await up.close(); }
}

describe.each(SCENARIOS)("live extraction via mock upstream: $id", (s) => {
  it("well-formed output becomes a canonical needs_review issue; LIVE_META only after the upstream answered", () =>
    run("muse-valid", async (app, up) => {
      const r = await post(app, "extract", { scenarioId: s.id }, { [BYOK_HEADER]: SENTINEL_BYOK });
      const parsed = ExtractResponseSchema.parse(r.json);
      if (!parsed.ok) throw new Error(r.text);
      const { issue } = parsed;
      expect(r.status).toBe(200);
      expect(issue.status).toBe("needs_review");
      expect(issue.location).toBe(s.area);
      expect(issue.assetLabel).toBe(s.assetLabel);
      expect(issue.provenance).toHaveLength(1);
      expect(issue.provenance[0]).toMatchObject({ source: "LIVE_META", provider: "meta", model: "muse-spark-1.3", operation: "extraction", requestId: FAKE_REQUEST_ID });
      expect(up.auths()).toEqual([`Bearer ${SENTINEL_BYOK}`]);
      expect(r.text).not.toContain(SENTINEL_BYOK);
    }));
});

describe("live extraction: untrusted model output", () => {
  it("model-supplied location, asset, scenario, id and status are discarded", () =>
    run("muse-overwrite", async (app) => {
      const r = await post(app, "extract", { scenarioId: "water-ingress-01" });
      const parsed = ExtractResponseSchema.parse(r.json);
      if (!parsed.ok) throw new Error(r.text);
      expect(parsed.issue).toMatchObject({ scenarioId: "water-ingress-01", location: "Level 2 / North corridor", assetLabel: "CEILING-ZONE-N2", status: "needs_review" });
      expect(r.text).not.toMatch(/Attacker-chosen|FAKE-ASSET-99|"evil"/);
    }));

  it("a stated cause is rejected: SAFETY_REVIEW_REQUIRED (422), no issue, no fixture", () =>
    run("muse-unsafe", async (app) => {
      const r = await post(app, "extract", { scenarioId: "water-ingress-01" });
      expect(r.json?.ok, r.text).toBe(false);
      expect(r.json.error.code).toBe("SAFETY_REVIEW_REQUIRED");
      expect(r.status).toBe(422);
      expect(r.json.issue).toBeUndefined();
      expect(r.text).not.toMatch(/DEMO_FIXTURE/);
    }));
});

describe("live segmentation via mock upstream", () => {
  it("unreadable segmentation text -> INVALID_RESPONSE, no fabricated mask", () =>
    run("muse-valid", async (app) => {
      const r = await post(app, "segment", { scenarioId: "water-ingress-01", prompt: "discoloured ceiling tile" });
      expect(r.json?.error?.code, r.text).toBe("INVALID_RESPONSE");
      expect(r.status).toBe(502);
      expect(r.json.segmentation).toBeUndefined();
    }));

  it("'nothing matched' (completed, empty text) is a canonical LIVE_META result with no boxes, shown by the UI as an empty state", () =>
    run("sam-empty", async (app) => {
      const r = await post(app, "segment", { scenarioId: "water-ingress-01", prompt: "a unicorn" });
      const parsed = SegmentResponseSchema.parse(r.json);
      if (!parsed.ok) throw new Error(r.text);
      expect(parsed.segmentation.boxes).toEqual([]);
      expect(parsed.segmentation.provenance).toMatchObject({ source: "LIVE_META", model: "sam-3.1", operation: "segmentation" });
    }));
});
