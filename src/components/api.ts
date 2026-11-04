import type { ZodType } from "zod";
import {
  ExtractResponseSchema,
  SegmentResponseSchema,
  type ExtractResponse,
  type ProviderError,
  type SegmentResponse,
} from "../lib/contracts";

const CLIENT_TIMEOUT_MS = 120_000;

/** Same-origin POST. The key travels only in its dedicated header, and only when one is set. */
async function post<T>(path: string, body: object, schema: ZodType<T>, apiKey: string | null): Promise<T | { ok: false; error: ProviderError }> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(apiKey ? { "X-FixFrame-Meta-Key": apiKey } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
  } catch (cause) {
    const timedOut = cause instanceof DOMException && cause.name === "TimeoutError";
    return {
      ok: false,
      error: timedOut
        ? { code: "TIMEOUT", message: "The server did not answer in time." }
        : { code: "UPSTREAM_ERROR", message: "The FixFrame server could not be reached." },
    };
  }
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  return parsed.success
    ? parsed.data
    : { ok: false, error: { code: "INVALID_RESPONSE", message: "The server's response did not match the expected format, so it was discarded." } };
}

export const requestSegmentation = (scenarioId: string, prompt: string, apiKey: string | null) =>
  post<SegmentResponse>("/api/segment", { scenarioId, prompt }, SegmentResponseSchema, apiKey);

export const requestExtraction = (scenarioId: string, apiKey: string | null) =>
  post<ExtractResponse>("/api/extract", { scenarioId }, ExtractResponseSchema, apiKey);
