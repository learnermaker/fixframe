import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureIssue, getFixtureSegmentation } from "../../data/fixtures";
import { getScenario, SCENARIOS } from "../../data/scenarios";
import { WORK_ORDER_TEMPLATES } from "../../data/workOrderTemplates";
import { IssueSchema, SegmentationSchema } from "../contracts";
import { evidenceRefResolves } from "./evidence";
import { findUnsafeClaims } from "./safety";

/** Width, height and colour type from a PNG's IHDR chunk. */
function readPng(publicPath: string) {
  const bytes = readFileSync(join(process.cwd(), "public", publicPath));
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colourType: bytes[25] };
}

const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error("missing fixture");
  return value;
};

describe("scenario catalog", () => {
  it("holds the three documented scenarios, all synthetic", () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual(["water-ingress-01", "cable-sheath-02", "handrail-bracket-03"]);
    expect(SCENARIOS.every((s) => s.synthetic)).toBe(true);
    expect(getScenario("nope")).toBeUndefined();
  });

  it("does not let callers mutate the catalog", () => {
    required(getScenario("water-ingress-01")).area = "changed";
    expect(required(getScenario("water-ingress-01")).area).toBe("Level 2 / North corridor");
  });
});

describe.each(SCENARIOS.map((s) => [s.id, s] as const))("fixtures for %s", (id, scenario) => {
  const issue = required(getFixtureIssue(id));
  const segmentation = required(getFixtureSegmentation(id));

  it("are schema-valid and deterministic", () => {
    expect(IssueSchema.safeParse(issue).success).toBe(true);
    expect(SegmentationSchema.safeParse(segmentation).success).toBe(true);
    expect(getFixtureIssue(id)).toEqual(issue);
    expect(getFixtureSegmentation(id)).toEqual(segmentation);
  });

  it("are explicitly DEMO_FIXTURE with stable fixture IDs", () => {
    expect(segmentation.provenance).toMatchObject({ source: "DEMO_FIXTURE", fixtureId: `${id}-mask-v1` });
    expect(issue.provenance).toHaveLength(1);
    expect(issue.provenance[0]).toMatchObject({ source: "DEMO_FIXTURE", fixtureId: `${id}-issue-v1` });
  });

  it("use trusted scenario identifiers and start in review", () => {
    expect(issue).toMatchObject({
      id: scenario.expectedIssueId,
      scenarioId: id,
      location: scenario.area,
      assetLabel: scenario.assetLabel,
      status: "needs_review",
    });
    expect(issue.unknowns.length).toBeGreaterThan(0);
  });

  it("cite evidence that resolves to scenario inputs", () => {
    expect(issue.evidence.map((e) => e.kind).sort()).toEqual(["image_region", "transcript"]);
    expect(issue.evidence.every((e) => evidenceRefResolves(e, scenario, [segmentation.id]))).toBe(true);
  });

  it("contain no disallowed claims, including the work-order template", () => {
    const template = required(WORK_ORDER_TEMPLATES[id]);
    const text = [
      issue.title,
      issue.description,
      template.title,
      template.summary,
      ...template.checklist.map((c) => c.label),
      ...template.acceptanceCriteria,
    ];
    expect(text.flatMap(findUnsafeClaims)).toEqual([]);
  });

  it("point at committed assets of the declared size", () => {
    expect(readPng(scenario.image.path)).toMatchObject({ width: 1280, height: 720 });
    expect(readPng(segmentation.mask.value)).toEqual({
      width: segmentation.imageWidth,
      height: segmentation.imageHeight,
      colourType: 6, // RGBA: the mask carries alpha
    });
  });
});

describe("unknown scenarios", () => {
  it("get no fixture rather than a default", () => {
    expect(getFixtureIssue("nope")).toBeUndefined();
    expect(getFixtureSegmentation("nope")).toBeUndefined();
  });
});
