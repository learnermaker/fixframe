import { describe, expect, it } from "vitest";
import {
  ExtractResponseSchema,
  IssueSchema,
  ProvenanceSchema,
  SegmentationSchema,
  SegmentRequestSchema,
  SegmentResponseSchema,
  WorkOrderSchema,
} from "./contracts";

const fixtureProvenance = {
  source: "DEMO_FIXTURE",
  provider: "fixture",
  model: "fixture-sam",
  operation: "segmentation",
  createdAt: "2026-11-04T00:00:00.000Z",
  fixtureId: "water-ingress-01-mask-v1",
};

// The transport examples from AGENT_WORKSTREAMS.md, with the mask-format placeholder resolved.
const documentedSegment = {
  ok: true,
  segmentation: {
    id: "seg-demo-001",
    imageWidth: 1280,
    imageHeight: 720,
    mask: { format: "public-path", value: "/demo-assets/masks/ceiling-tile.png" },
    boxes: [],
    provenance: fixtureProvenance,
  },
};
const documentedIssue = {
  id: "issue-demo-001",
  scenarioId: "water-ingress-01",
  title: "Discoloured ceiling tile observed",
  description: "A discoloured patch is visible. Its source and cause are unknown.",
  location: "Level 2 / North corridor",
  assetLabel: "CEILING-ZONE-N2",
  category: "building_fabric",
  urgency: "review",
  status: "needs_review",
  evidence: [],
  unknowns: ["source of mark", "hidden extent", "safety status"],
  provenance: [],
};

describe("API transport shapes", () => {
  it("accept the documented examples", () => {
    expect(SegmentRequestSchema.safeParse({ scenarioId: "water-ingress-01", prompt: "discoloured ceiling tile" }).success).toBe(true);
    expect(SegmentResponseSchema.safeParse(documentedSegment).success).toBe(true);
    expect(ExtractResponseSchema.safeParse({ ok: true, issue: documentedIssue }).success).toBe(true);
    expect(
      ExtractResponseSchema.safeParse({ ok: false, error: { code: "UNCONFIGURED", message: "Live provider is not configured." } }).success,
    ).toBe(true);
  });

  it("reject unknown error codes and arbitrary provider payloads", () => {
    expect(ExtractResponseSchema.safeParse({ ok: false, error: { code: "NOPE", message: "x" } }).success).toBe(false);
    expect(SegmentResponseSchema.safeParse({ ...documentedSegment, raw: {} }).success).toBe(false);
  });
});

describe("IssueSchema", () => {
  it.each([
    ["category", { category: "plumbing" }],
    ["urgency", { urgency: "critical" }],
    ["status", { status: "open" }],
    ["numeric confidence", { confidence: 0.93 }],
    ["snake_case field", { asset_label: "X" }],
    ["blank title", { title: "  " }],
  ])("rejects invalid %s", (_label, patch) => {
    expect(IssueSchema.safeParse({ ...documentedIssue, ...patch }).success).toBe(false);
  });

  it("allows the null confidence shown in ARCHITECTURE.md", () => {
    expect(IssueSchema.safeParse({ ...documentedIssue, confidence: null }).success).toBe(true);
  });
});

describe("ProvenanceSchema", () => {
  const live = { ...fixtureProvenance, source: "LIVE_META", provider: "meta", model: "sam-3.1", fixtureId: null };
  const edit = { source: "USER_EDIT", provider: "user", model: null, operation: "user_edit", createdAt: fixtureProvenance.createdAt };

  it("accepts each source in its valid form", () => {
    for (const p of [fixtureProvenance, live, edit]) expect(ProvenanceSchema.safeParse(p).success).toBe(true);
  });

  it.each([
    ["unknown source", { ...fixtureProvenance, source: "GUESS" }],
    ["fixture without fixtureId", { ...fixtureProvenance, fixtureId: null }],
    ["live carrying a fixtureId", { ...live, fixtureId: "water-ingress-01-mask-v1" }],
    ["live without a model", { ...live, model: null }],
    ["user edit naming a model", { ...edit, model: "sam-3.1" }],
    ["user edit as a model operation", { ...edit, operation: "extraction" }],
    ["non-ISO timestamp", { ...fixtureProvenance, createdAt: "yesterday" }],
  ])("rejects %s", (_label, value) => {
    expect(ProvenanceSchema.safeParse(value).success).toBe(false);
  });
});

describe("SegmentationSchema", () => {
  const base = documentedSegment.segmentation;

  it("rejects a box outside the image", () => {
    expect(SegmentationSchema.safeParse({ ...base, boxes: [{ x: 1200, y: 0, width: 100, height: 10 }] }).success).toBe(false);
  });

  it.each([
    ["remote URL as a path", { format: "public-path", value: "https://example.com/mask.png" }],
    ["path traversal", { format: "public-path", value: "/demo-assets/masks/../../secret.png" }],
    ["non-PNG data URL", { format: "alpha-png-data-url", value: "data:image/svg+xml;base64,AAAA" }],
    ["unknown format", { format: "rle", value: "abc" }],
  ])("rejects %s", (_label, mask) => {
    expect(SegmentationSchema.safeParse({ ...base, mask }).success).toBe(false);
  });

  it("accepts a PNG data URL for live results", () => {
    expect(SegmentationSchema.safeParse({ ...base, mask: { format: "alpha-png-data-url", value: "data:image/png;base64,iVBORw0KGgo=" } }).success).toBe(true);
  });
});

describe("WorkOrderSchema", () => {
  it("rejects a status outside the work-order enum", () => {
    const workOrder = {
      id: "WO-DEMO-001",
      issueId: "issue-demo-001",
      title: "t",
      summary: "s",
      owner: "o",
      status: "needs_review",
      checklist: [],
      acceptanceCriteria: [],
      feedback: [],
      events: [],
    };
    expect(WorkOrderSchema.safeParse(workOrder).success).toBe(false);
    expect(WorkOrderSchema.safeParse({ ...workOrder, status: "open" }).success).toBe(true);
  });
});
