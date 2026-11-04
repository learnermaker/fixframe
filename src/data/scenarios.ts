import { ScenarioSchema, type Scenario } from "../lib/contracts";

// All content is authored and fictional; see docs/DEMO_DATA.md.
export const SCENARIOS: readonly Scenario[] = [
  {
    id: "water-ingress-01",
    title: "Ceiling tile discolouration",
    synthetic: true,
    site: "Demo Building A",
    area: "Level 2 / North corridor",
    assetLabel: "CEILING-ZONE-N2",
    image: {
      path: "/demo-assets/ceiling-tile.png",
      alt: "Illustration of a suspended ceiling grid with a visible discoloured patch on one tile",
    },
    transcript:
      "I noticed a discoloured patch on the ceiling tile near the north corridor. I don't know what caused it.",
    segmentationPrompt: "discolored patch",
    expectedIssueId: "issue-demo-001",
  },
  {
    id: "cable-sheath-02",
    title: "Cable sheath mark on isolated training prop",
    synthetic: true,
    site: "Demo Workshop B",
    area: "Training bench 04",
    assetLabel: "TRAINING-CABLE-04",
    image: {
      path: "/demo-assets/cable-sheath.png",
      alt: "Illustration of a disconnected display cable on a training bench with a visible mark on its outer sheath",
    },
    transcript:
      "There is a visible mark on the cable covering at the training bench. This is a disconnected display prop.",
    segmentationPrompt: "worn patch on cable",
    expectedIssueId: "issue-demo-002",
  },
  {
    id: "handrail-bracket-03",
    title: "Handrail bracket on mock training fixture",
    synthetic: true,
    site: "Demo Training Facility",
    area: "Mock stairwell rig",
    assetLabel: "RAIL-FIXTURE-03",
    image: {
      path: "/demo-assets/handrail-bracket.png",
      alt: "Illustration of a mock handrail fixture with one wall bracket sitting out of line with the others",
    },
    transcript:
      "The bracket on the mock handrail fixture looks out of alignment. Please review the training rig.",
    segmentationPrompt: "bracket",
    expectedIssueId: "issue-demo-003",
  },
].map((scenario) => ScenarioSchema.parse(scenario));

export function getScenario(id: string): Scenario | undefined {
  const scenario = SCENARIOS.find((s) => s.id === id);
  return scenario && structuredClone(scenario);
}
