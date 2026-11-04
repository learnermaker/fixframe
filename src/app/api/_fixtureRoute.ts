import type { ZodType } from "zod";
import type { ProviderError, Scenario } from "../../lib/contracts";
import { getScenario } from "../../data/scenarios";

// ponytail: temporary fixture-only stand-in so the frontend flow runs end to end. Workstream B
// replaces this and both route files with real providers; it makes no model calls of any kind.
const errorResponse = (status: number, code: ProviderError["code"], message: string) =>
  Response.json({ ok: false, error: { code, message } }, { status });

export async function fixtureRoute<Body extends { scenarioId: string }>(
  request: Request,
  schema: ZodType<Body>,
  respond: (scenario: Scenario) => object | undefined,
): Promise<Response> {
  if (process.env.FIXFRAME_PROVIDER_MODE === "live") {
    return errorResponse(503, "UNCONFIGURED", "The live provider is not available in this build. Restart the server in fixture mode to use demo fixtures.");
  }
  const body = schema.safeParse(await request.json().catch(() => undefined));
  if (!body.success) return errorResponse(400, "UNSUPPORTED_INPUT", "The request body is not valid.");
  const scenario = getScenario(body.data.scenarioId);
  const payload = scenario && respond(scenario);
  if (!payload) return errorResponse(404, "UNSUPPORTED_INPUT", `Unknown scenario ${body.data.scenarioId}.`);
  return Response.json({ ok: true, ...payload });
}
