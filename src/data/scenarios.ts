import { ScenarioSchema, type Scenario } from "../lib/contracts";

// Sites, assets and transcripts are authored and fictional. Some images are real third-party
// photographs; see docs/DEMO_DATA.md and assets/demo-evidence/README.md.
export const SCENARIOS: readonly Scenario[] = [
  {
    id: "water-ingress-01",
    title: "Ceiling tile discolouration",
    synthetic: true,
    site: "Demo Building A",
    area: "Level 2 / North corridor",
    assetLabel: "CEILING-ZONE-N2",
    image: {
      path: "/demo-assets/evidence/ceiling-water-damage.jpg",
      alt: "Photograph of a suspended ceiling with a large discoloured patch on one tile",
      width: 1600,
      height: 1200,
      credit: {
        text: "Photo: Atomicdragon136, Wikimedia Commons, CC BY 3.0, resized",
        url: "https://commons.wikimedia.org/wiki/File:Ceiling_water_damage.jpg",
      },
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
      width: 1280,
      height: 720,
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
      width: 1280,
      height: 720,
    },
    transcript:
      "The bracket on the mock handrail fixture looks out of alignment. Please review the training rig.",
    segmentationPrompt: "bracket",
    expectedIssueId: "issue-demo-003",
  },
  {
    id: "pipework-corrosion-04",
    title: "Corrosion around a pipe joint",
    synthetic: true,
    site: "Demo Plant C",
    area: "Plant room 2",
    assetLabel: "PIPE-JOINT-04",
    image: {
      path: "/demo-assets/evidence/industrial-pipes-corrosion.jpg",
      alt: "Photograph of industrial pipes and valves, with rust visible on the pipework and fittings",
      width: 1600,
      height: 1067,
      credit: {
        text: "Photo: Attila Lénert, Unsplash, resized",
        url: "https://unsplash.com/photos/rusty-industrial-pipes-and-valves-in-a-factory-6uJTDNz6n0k",
      },
    },
    transcript: "There is visible corrosion around this pipe joint. Please have the maintenance team inspect it.",
    segmentationPrompt: "corrosion",
    expectedIssueId: "issue-demo-004",
  },
  {
    id: "concrete-spalling-05",
    title: "Deterioration on a concrete column",
    synthetic: true,
    site: "Demo Structure D",
    area: "Support column 5",
    assetLabel: "CONCRETE-COLUMN-05",
    image: {
      path: "/demo-assets/evidence/bridge-concrete-spalling.jpg",
      alt: "Photograph of a concrete column under a steel structure, with chipped concrete and rust-coloured marks on its surface",
      width: 1068,
      height: 1600,
      credit: {
        text: "Photo: OregonDOT, Wikimedia Commons, CC BY 2.0, resized",
        url: "https://commons.wikimedia.org/wiki/File:Spalling_concrete_on_the_pier_columns.jpg",
      },
    },
    transcript: "There is visible deterioration on this concrete surface. Please arrange an inspection.",
    segmentationPrompt: "rust",
    expectedIssueId: "issue-demo-005",
  },
].map((scenario) => ScenarioSchema.parse(scenario));

export function getScenario(id: string): Scenario | undefined {
  const scenario = SCENARIOS.find((s) => s.id === id);
  return scenario && structuredClone(scenario);
}
