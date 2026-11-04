import { ExtractRequestSchema } from "../../../lib/contracts";
import { providerRoute } from "../../../server/providers/route";

export function POST(request: Request) {
  return providerRoute(request, ExtractRequestSchema, "issue", (providers, scenario) => providers.extraction.extract(scenario));
}
