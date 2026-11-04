import { SegmentRequestSchema } from "../../../lib/contracts";
import { providerRoute } from "../../../server/providers/route";

export function POST(request: Request) {
  return providerRoute(request, SegmentRequestSchema, "segmentation", (providers, scenario, body) =>
    providers.segmentation.segment(scenario, body.prompt),
  );
}
