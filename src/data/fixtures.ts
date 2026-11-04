import { IssueSchema, SegmentationSchema, type Box, type Issue, type Segmentation } from "../lib/contracts";
import { transcriptRef } from "../lib/domain/evidence";

// Authored test fixtures, not ground truth. The timestamp is fixed so output is byte-stable.
const FIXTURE_CREATED_AT = "2026-11-04T00:00:00.000Z";

const fixtureProvenance = (operation: "segmentation" | "extraction", model: string, fixtureId: string) => ({
  source: "DEMO_FIXTURE" as const,
  provider: "fixture",
  model,
  operation,
  requestId: null,
  createdAt: FIXTURE_CREATED_AT,
  fixtureId,
});

const segmentation = (scenarioId: string, id: string, mask: string, box: Box): Segmentation =>
  SegmentationSchema.parse({
    id,
    imageWidth: 1280,
    imageHeight: 720,
    mask: { format: "public-path", value: `/demo-assets/masks/${mask}.png` },
    boxes: [box], // bounding box printed by src/data/render-demo-assets.mjs
    provenance: fixtureProvenance("segmentation", "fixture-sam", `${scenarioId}-mask-v1`),
  });

const SEGMENTATIONS: Readonly<Record<string, Segmentation>> = {
  "water-ingress-01": segmentation("water-ingress-01", "seg-demo-001", "ceiling-tile", { x: 453, y: 221, width: 330, height: 258 }),
  "cable-sheath-02": segmentation("cable-sheath-02", "seg-demo-002", "cable-sheath", { x: 640, y: 344, width: 91, height: 76 }),
  "handrail-bracket-03": segmentation("handrail-bracket-03", "seg-demo-003", "handrail-bracket", { x: 574, y: 264, width: 105, height: 169 }),
};

const ISSUES: Readonly<Record<string, Issue>> = Object.fromEntries(
  [
    {
      id: "issue-demo-001",
      scenarioId: "water-ingress-01",
      title: "Discoloured ceiling tile observed",
      description: "A discoloured patch is visible on the ceiling tile. Its source and cause are unknown.",
      location: "Level 2 / North corridor",
      assetLabel: "CEILING-ZONE-N2",
      category: "building_fabric",
      urgency: "review",
      segmentationId: "seg-demo-001",
      imageSupports: "visible discolouration",
      transcriptSupports: "reported location",
      unknowns: ["source of mark", "hidden extent", "whether moisture is present", "safety status"],
    },
    {
      id: "issue-demo-002",
      scenarioId: "cable-sheath-02",
      title: "Visible mark on training prop cable sheath",
      description: "A mark is visible on the outer sheath of a disconnected display prop. Its origin is unknown.",
      location: "Training bench 04",
      assetLabel: "TRAINING-CABLE-04",
      category: "electrical_visual_observation",
      urgency: "review",
      segmentationId: "seg-demo-002",
      imageSupports: "visible sheath mark",
      transcriptSupports: "prop described as a disconnected display item",
      unknowns: ["real-world electrical state", "internal conductor condition", "suitability for use"],
    },
    {
      id: "issue-demo-003",
      scenarioId: "handrail-bracket-03",
      title: "Handrail bracket appears out of alignment on mock rig",
      description: "A bracket on the mock handrail fixture appears displaced relative to the others.",
      location: "Mock stairwell rig",
      assetLabel: "RAIL-FIXTURE-03",
      category: "accessibility_fixture",
      urgency: "review",
      segmentationId: "seg-demo-003",
      imageSupports: "visibly displaced bracket",
      transcriptSupports: "reported misalignment on the training rig",
      unknowns: ["load capacity", "structural condition", "suitability outside the demo"],
    },
  ].map(({ segmentationId, imageSupports, transcriptSupports, ...issue }) => [
    issue.scenarioId,
    IssueSchema.parse({
      ...issue,
      status: "needs_review",
      evidence: [
        { kind: "image_region", ref: segmentationId, supports: imageSupports },
        { kind: "transcript", ref: transcriptRef(issue.scenarioId), supports: transcriptSupports },
      ],
      provenance: [fixtureProvenance("extraction", "fixture-muse", `${issue.scenarioId}-issue-v1`)],
    }),
  ]),
);

// Clones keep the catalog immutable: callers may freely edit what they receive.
export function getFixtureSegmentation(scenarioId: string): Segmentation | undefined {
  const fixture = SEGMENTATIONS[scenarioId];
  return fixture && structuredClone(fixture);
}

export function getFixtureIssue(scenarioId: string): Issue | undefined {
  const fixture = ISSUES[scenarioId];
  return fixture && structuredClone(fixture);
}
