import { getFixtureIssue } from "../../../data/fixtures";
import { ExtractRequestSchema } from "../../../lib/contracts";
import { fixtureRoute } from "../_fixtureRoute";

export function POST(request: Request) {
  return fixtureRoute(request, ExtractRequestSchema, (scenario) => {
    const issue = getFixtureIssue(scenario.id);
    return issue && { issue };
  });
}
