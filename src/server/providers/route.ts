import type { ZodType } from "zod";
import { getScenario } from "../../data/scenarios";
import type { ProviderError, Scenario } from "../../lib/contracts";
import { providerMode } from "../env";
import { resolveMetaKey } from "./credentials";
import { fixtureProviders } from "./fixture";
import { museProvider } from "./museProvider";
import { samProvider } from "./samProvider";
import { fail, type ProviderResult, type Providers } from "./types";

const HTTP_STATUS: Record<ProviderError["code"], number> = {
  UNCONFIGURED: 503,
  TIMEOUT: 504,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  INVALID_RESPONSE: 502,
  UNSUPPORTED_INPUT: 400,
  SAFETY_REVIEW_REQUIRED: 422,
};

/** Fixtures only when the mode says so: a missing key or failed live call never lands here. */
function selectProviders(headers: Headers): ProviderResult<Providers> {
  if (providerMode() === "fixture") return { ok: true, value: fixtureProviders };
  const key = resolveMetaKey(headers);
  return key.ok ? { ok: true, value: { segmentation: samProvider(key.value), extraction: museProvider(key.value) } } : key;
}

const NO_STORE = { "cache-control": "no-store" };

const send = <T>(field: string, result: ProviderResult<T>) =>
  result.ok
    ? Response.json({ ok: true, [field]: result.value }, { headers: NO_STORE })
    : Response.json({ ok: false, error: result.error }, { status: HTTP_STATUS[result.error.code], headers: NO_STORE });

export async function providerRoute<Body extends { scenarioId: string }, T>(
  request: Request,
  schema: ZodType<Body>,
  field: "segmentation" | "issue",
  run: (providers: Providers, scenario: Scenario, body: Body) => Promise<ProviderResult<T>>,
): Promise<Response> {
  // A cross-site form can post text/plain without a preflight and spend the deployment key.
  const isJson = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() === "application/json";
  const body = schema.safeParse(isJson ? await request.json().catch(() => undefined) : undefined);
  if (!body.success) return send(field, fail("UNSUPPORTED_INPUT", "The request body is not valid."));
  const scenario = getScenario(body.data.scenarioId);
  if (!scenario) return send(field, fail("UNSUPPORTED_INPUT", "Unknown scenario."));
  const providers = selectProviders(request.headers);
  if (!providers.ok) return send(field, providers);
  try {
    return send(field, await run(providers.value, scenario, body.data));
  } catch {
    // No error detail: nothing thrown on this path may reach the client or the logs.
    return send(field, fail("UPSTREAM_ERROR", "The provider request failed unexpectedly."));
  }
}
