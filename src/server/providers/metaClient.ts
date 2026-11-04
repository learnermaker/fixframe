import { z } from "zod";
import { metaApiBaseUrl, metaTimeoutMs } from "../env";
import { fail, type ProviderResult } from "./types";

const ResponseSchema = z.object({
  status: z.string(),
  output: z.array(
    z.object({
      type: z.string(),
      content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
    }),
  ),
});

export type MetaOutput = { text: string; requestId: string | null };

const INVALID = "Meta's response did not match the documented format, so it was discarded.";

/**
 * POST /v1/responses. Error messages never quote the upstream body or the thrown error: either
 * could echo the request, and this is the only place the key goes into a header.
 */
export async function createResponse(key: string, body: object): Promise<ProviderResult<MetaOutput>> {
  let response: Response;
  let raw: string;
  try {
    response = await fetch(`${metaApiBaseUrl()}/v1/responses`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ store: false, ...body }),
      signal: AbortSignal.timeout(metaTimeoutMs()),
      cache: "no-store",
    });
    raw = await response.text();
  } catch (cause) {
    return cause instanceof Error && cause.name === "TimeoutError"
      ? fail("TIMEOUT", "Meta did not answer in time.")
      : fail("UPSTREAM_ERROR", "Meta could not be reached.");
  }

  if (response.status === 401 || response.status === 403) {
    return fail("UPSTREAM_ERROR", "Meta rejected this API key. No other key or demo data was used.");
  }
  if (response.status === 429) return fail("RATE_LIMITED", "Meta is limiting requests for this key.");
  // Meta's error guide: these fail the same way until the request changes, so "retry" would be wrong advice.
  if (response.status === 400 || response.status === 413) return fail("UNSUPPORTED_INPUT", "Meta could not accept this input.");
  if (response.status === 408 || response.status === 504) return fail("TIMEOUT", "Meta timed out on this request.");
  if (!response.ok) return fail("UPSTREAM_ERROR", `Meta answered with HTTP ${response.status}.`);

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail("INVALID_RESPONSE", INVALID);
  }
  const parsed = ResponseSchema.safeParse(json);
  if (!parsed.success) return fail("INVALID_RESPONSE", INVALID);
  if (parsed.data.status !== "completed") return fail("UPSTREAM_ERROR", "Meta did not finish this request.");

  const content = parsed.data.output.filter((item) => item.type === "message").flatMap((item) => item.content ?? []);
  if (content.some((part) => part.type === "refusal")) return fail("UPSTREAM_ERROR", "Meta declined this request.");
  const texts = content.filter((part) => part.type === "output_text").map((part) => part.text);
  // Empty text is valid (SAM's answer when nothing matches); a missing text part is not.
  if (texts.length === 0 || texts.some((text) => text === undefined)) return fail("INVALID_RESPONSE", INVALID);
  return { ok: true, value: { text: texts.join(""), requestId: response.headers.get("x-request-id") || null } };
}
