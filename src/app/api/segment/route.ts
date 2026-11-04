import { getFixtureSegmentation } from "../../../data/fixtures";
import { SegmentRequestSchema } from "../../../lib/contracts";
import { fixtureRoute } from "../_fixtureRoute";

export function POST(request: Request) {
  return fixtureRoute(request, SegmentRequestSchema, (scenario) => {
    const segmentation = getFixtureSegmentation(scenario.id);
    return segmentation && { segmentation };
  });
}
