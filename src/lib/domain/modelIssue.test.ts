import { describe, expect, it } from "vitest";
import { getScenario } from "../../data/scenarios";
import type { Provenance, Scenario } from "../contracts";
import { IssueSchema } from "../contracts";
import { transcriptRef } from "./evidence";
import { issueFromModelOutput } from "./modelIssue";
import { findUnsafeClaims } from "./safety";

const scenario = getScenario("water-ingress-01") as Scenario;
const provenance: Provenance = {
  source: "LIVE_META",
  provider: "meta",
  model: "muse-spark-1.3",
  operation: "extraction",
  requestId: "req-1",
  createdAt: "2026-11-04T00:00:00.000Z",
};
const output = {
  title: "Patch on tile",
  description: "A discoloured patch is visible.",
  category: "building_fabric",
  urgency: "review",
  evidence: [{ kind: "image_region", ref: "seg-1", supports: "visible patch" }],
  unknowns: ["source of mark"],
};
const convert = (raw: unknown) => issueFromModelOutput(raw, scenario, provenance, ["seg-1"]);

describe("issueFromModelOutput", () => {
  it("builds a valid needs_review issue, preserving unknowns, evidence and live provenance", () => {
    const result = convert(output);
    if (!result.ok) throw new Error(result.error.message);
    expect(IssueSchema.safeParse(result.issue).success).toBe(true);
    expect(result.issue).toMatchObject({ status: "needs_review", unknowns: output.unknowns, evidence: output.evidence });
    expect(result.issue.provenance).toEqual([provenance]);
  });

  it("ignores model attempts to set trusted identifiers or status", () => {
    const result = convert({
      ...output,
      id: "evil",
      scenarioId: "other",
      location: "Roof",
      assetLabel: "FAKE-ASSET",
      status: "completed",
      provenance: [{ source: "USER_EDIT" }],
    });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.issue).toMatchObject({
      id: scenario.expectedIssueId,
      scenarioId: scenario.id,
      location: scenario.area,
      assetLabel: scenario.assetLabel,
      status: "needs_review",
    });
    expect(result.issue.provenance).toEqual([provenance]);
  });

  it.each([
    ["non-object output", "not json"],
    ["unknown enum", { ...output, category: "leak" }],
    ["dropped unknowns", { ...output, unknowns: [] }],
    ["dropped evidence", { ...output, evidence: [] }],
    ["unresolved image region", { ...output, evidence: [{ kind: "image_region", ref: "seg-999", supports: "x" }] }],
    ["another scenario's transcript", { ...output, evidence: [{ kind: "transcript", ref: transcriptRef("cable-sheath-02"), supports: "x" }] }],
  ])("returns INVALID_RESPONSE for %s", (_label, raw) => {
    expect(convert(raw)).toMatchObject({ ok: false, error: { code: "INVALID_RESPONSE" } });
  });

  it.each([
    "The patch was caused by a burst pipe.",
    "The root cause is condensation.",
    "The ceiling is safe to occupy.",
    "Replace the tile and seal the joint.",
  ])("returns SAFETY_REVIEW_REQUIRED for: %s", (description) => {
    expect(convert({ ...output, description })).toMatchObject({ ok: false, error: { code: "SAFETY_REVIEW_REQUIRED" } });
  });
});

describe("findUnsafeClaims", () => {
  it.each([
    "Its source and cause are unknown.",
    "I don't know what caused it.",
    "Safety status is unknown.",
    "Record a qualified follow-up decision.",
  ])("passes observation-only text: %s", (text) => {
    expect(findUnsafeClaims(text)).toEqual([]);
  });

  it("labels each claim type", () => {
    expect(findUnsafeClaims("This is leaking, is safe, and is caused by a pipe. Turn off the valve.")).toEqual([
      "cause",
      "diagnosis",
      "safety_certification",
      "repair_instruction",
    ]);
  });
});
