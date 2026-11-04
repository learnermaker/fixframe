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

/** Width and height from a JPEG's start-of-frame marker. */
function readJpegSize(publicPath: string) {
  const bytes = readFileSync(join(process.cwd(), "public", publicPath));
  for (let at = 2; at < bytes.length; at += 2 + bytes.readUInt16BE(at + 2)) {
    const marker = bytes[at + 1]!;
    if (marker >= 0xc0 && marker <= 0xc2) return { width: bytes.readUInt16BE(at + 7), height: bytes.readUInt16BE(at + 5) };
  }
  throw new Error(`no frame marker in ${publicPath}`);
}

const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error("missing fixture");
  return value;
};

describe("scenario catalog", () => {
  it("holds the documented scenarios, all with authored metadata", () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual([
      "water-ingress-01",
      "cable-sheath-02",
      "handrail-bracket-03",
      "pipework-corrosion-04",
      "concrete-spalling-05",
    ]);
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

  it("credit every photograph", () => {
    if (scenario.image.path.endsWith(".jpg")) expect(scenario.image.credit).toBeDefined();
  });

  it("point at committed assets of the declared size", () => {
    const { path, width, height } = scenario.image;
    expect(path.endsWith(".jpg") ? readJpegSize(path) : readPng(path)).toMatchObject({ width, height });
    expect([segmentation.imageWidth, segmentation.imageHeight]).toEqual([width, height]);
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
