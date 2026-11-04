import { inflateSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as extractPost } from "../../app/api/extract/route";
import { POST as segmentPost } from "../../app/api/segment/route";
import { ExtractResponseSchema, SegmentResponseSchema } from "../../lib/contracts";
import { transcriptRef } from "../../lib/domain/evidence";
import { alphaPngDataUrl } from "./alphaPng";

// Fake values: they prove routing and non-disclosure and are not credentials.
const USER_KEY = "FF_SENTINEL_BYOK_not-a-real-key";
const SERVER_KEY = "FF_SENTINEL_SERVER_not-a-real-key";
const SCENARIO = "water-ingress-01";

// One record in the format the official parser's README documents for SAM 3.1 output.
const SAM_TEXT =
  "<0f>0<|box;x1=211;y1=228;x2=270;y2=254;w=1600;h=1200|>" +
  "<|mask;x=0;y=0;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7`e.ioeAf6-k/#Xd8%dX9x(|>\n";

const metaReply = (text: string) => ({
  id: "resp_1",
  status: "completed",
  output: [{ type: "message", content: [{ type: "output_text", text }] }],
});
const museText = (overrides: object = {}) =>
  JSON.stringify({
    title: "Discoloured patch on ceiling tile",
    description: "A discoloured patch is visible. Its source is unknown.",
    category: "building_fabric",
    urgency: "review",
    evidence: [{ kind: "transcript", ref: transcriptRef(SCENARIO), supports: "reported location" }],
    unknowns: ["source of mark"],
    ...overrides,
  });

let fetchMock: ReturnType<typeof vi.fn>;
const reply = (body: unknown, status = 200) =>
  fetchMock.mockImplementation(
    async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "x-request-id": "req-1" } }),
  );
const request = (body: object, key?: string) =>
  new Request("http://fixframe.test/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...(key ? { "X-FixFrame-Meta-Key": key } : {}) },
    body: JSON.stringify(body),
  });
const segment = (key?: string, prompt = "patch") => segmentPost(request({ scenarioId: SCENARIO, prompt }, key));
const extract = (key?: string) => extractPost(request({ scenarioId: SCENARIO }, key));
const sentBearer = (call = 0) => (fetchMock.mock.calls[call]![1] as RequestInit & { headers: Record<string, string> }).headers.authorization;
const sentBody = () => JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("FIXFRAME_PROVIDER_MODE", "live");
  vi.stubEnv("META_API_TOKEN", "");
  vi.stubEnv("META_API_BASE_URL", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("credential resolution", () => {
  it.each([["segment", segment], ["extract", extract]] as const)("%s with no key answers UNCONFIGURED and calls nobody", async (_name, route) => {
    const response = await route();
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("UNCONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards a user key when the server has none", async () => {
    reply(metaReply(SAM_TEXT));
    expect((await segment(USER_KEY)).status).toBe(200);
    expect(sentBearer()).toBe(`Bearer ${USER_KEY}`);
  });

  it("uses the deployment key when no user key is sent", async () => {
    vi.stubEnv("META_API_TOKEN", SERVER_KEY);
    reply(metaReply(museText()));
    expect((await extract()).status).toBe(200);
    expect(sentBearer()).toBe(`Bearer ${SERVER_KEY}`);
  });

  it("prefers the user key for that request only, and leaves the environment alone", async () => {
    vi.stubEnv("META_API_TOKEN", SERVER_KEY);
    reply(metaReply(SAM_TEXT));
    await segment(USER_KEY);
    await segment();
    expect(sentBearer(0)).toBe(`Bearer ${USER_KEY}`);
    expect(sentBearer(1)).toBe(`Bearer ${SERVER_KEY}`);
    expect(process.env.META_API_TOKEN).toBe(SERVER_KEY);
  });

  it.each([401, 403])("a user key rejected with HTTP %i is not retried with the deployment key or fixtures", async (status) => {
    vi.stubEnv("META_API_TOKEN", SERVER_KEY);
    reply({ error: { message: `bad key ${USER_KEY}` } }, status);
    const response = await segment(USER_KEY);
    const text = await response.text();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentBearer()).toBe(`Bearer ${USER_KEY}`);
    expect(JSON.parse(text).error.code).toBe("UPSTREAM_ERROR");
    expect(text).not.toMatch(/DEMO_FIXTURE|segmentation"/);
  });

  it("refuses a malformed user key before calling Meta, without quoting it", async () => {
    vi.stubEnv("META_API_TOKEN", SERVER_KEY);
    const response = await segment("FF_SENTINEL bad key");
    const text = await response.text();
    expect(JSON.parse(text).error.code).toBe("UNSUPPORTED_INPUT");
    expect(text).not.toContain("FF_SENTINEL");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fixture mode uses neither credential and calls nobody", async () => {
    vi.stubEnv("FIXFRAME_PROVIDER_MODE", "fixture");
    vi.stubEnv("META_API_TOKEN", SERVER_KEY);
    const body = await (await segment(USER_KEY)).json();
    expect(body.segmentation.provenance.source).toBe("DEMO_FIXTURE");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("an unset mode is live, not fixtures", async () => {
    vi.stubEnv("FIXFRAME_PROVIDER_MODE", "");
    expect((await (await extract()).json()).error.code).toBe("UNCONFIGURED");
  });
});

describe("secret handling", () => {
  it("never puts either key in a response or a log, on success or on any failure", async () => {
    vi.stubEnv("META_API_TOKEN", SERVER_KEY);
    const logs = (["log", "info", "warn", "error", "debug"] as const).map((level) => vi.spyOn(console, level));
    const upstream: [unknown, number][] = [
      [metaReply(SAM_TEXT), 200],
      [`echo ${USER_KEY} ${SERVER_KEY}`, 200],
      [{ error: `echo ${USER_KEY} ${SERVER_KEY}` }, 500],
      [{ error: `echo ${USER_KEY} ${SERVER_KEY}` }, 401],
      [{ error: `echo ${USER_KEY} ${SERVER_KEY}` }, 429],
    ];
    for (const [body, status] of upstream) {
      reply(body, status);
      for (const key of [USER_KEY, undefined]) {
        const text = await (await segment(key)).text();
        expect(text).not.toContain(USER_KEY);
        expect(text).not.toContain(SERVER_KEY);
      }
    }
    fetchMock.mockRejectedValue(new Error(`socket failed with ${USER_KEY}`));
    const text = await (await segment(USER_KEY)).text();
    expect(JSON.parse(text).error.code).toBe("UPSTREAM_ERROR");
    expect(text).not.toContain(USER_KEY);
    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });

  it("never puts a key in the upstream URL or body", async () => {
    reply(metaReply(SAM_TEXT));
    await segment(USER_KEY);
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe("https://api.meta.ai/v1/responses");
    expect(String(init.body)).not.toContain(USER_KEY);
  });
});

describe("request boundary", () => {
  it.each(["text/plain", "application/x-www-form-urlencoded", undefined])("refuses content type %s without calling Meta", async (type) => {
    const response = await segmentPost(
      new Request("http://fixframe.test/api", {
        method: "POST",
        headers: { ...(type ? { "content-type": type } : {}), "X-FixFrame-Meta-Key": USER_KEY },
        body: new TextEncoder().encode(JSON.stringify({ scenarioId: SCENARIO, prompt: "patch" })),
      }),
    );
    expect((await response.json()).error.code).toBe("UNSUPPORTED_INPUT");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts JSON with a charset", async () => {
    reply(metaReply(SAM_TEXT));
    const response = await segmentPost(
      new Request("http://fixframe.test/api", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8", "X-FixFrame-Meta-Key": USER_KEY },
        body: JSON.stringify({ scenarioId: SCENARIO, prompt: "patch" }),
      }),
    );
    expect(response.status).toBe(200);
  });

  it("treats a blank key header as no key: ADR 0002 trims and requires non-empty", async () => {
    vi.stubEnv("META_API_TOKEN", SERVER_KEY);
    reply(metaReply(SAM_TEXT));
    await segmentPost(
      new Request("http://fixframe.test/api", {
        method: "POST",
        headers: { "content-type": "application/json", "X-FixFrame-Meta-Key": "   " },
        body: JSON.stringify({ scenarioId: SCENARIO, prompt: "patch" }),
      }),
    );
    expect(sentBearer()).toBe(`Bearer ${SERVER_KEY}`);
  });
});

describe("SAM mask geometry", () => {
  /** Reads the returned PNG back into alpha values, so these tests check pixels rather than the box list. */
  function alphaAt(dataUrl: string) {
    const png = Buffer.from(dataUrl.split(",")[1]!, "base64");
    const width = png.readUInt32BE(16);
    const pixels = inflateSync(png.subarray(41, 41 + png.readUInt32BE(33)));
    return (x: number, y: number) => pixels[y * (1 + width * 2) + 1 + x * 2 + 1];
  }
  const record = (id: number, left: number, top: number) =>
    `${id}<|box;x1=${left};y1=${top};x2=${left + 59};y2=${top + 26};w=1600;h=1200|><|mask;x=0;y=0;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7\`e.ioeAf6-k/#Xd8%dX9x(|>`;
  async function segmentOf(text: string) {
    reply(metaReply(text));
    const parsed = SegmentResponseSchema.parse(await (await segment(USER_KEY)).json());
    if (!parsed.ok) throw new Error("expected success");
    return parsed.segmentation;
  }
  const covered = (alpha: (x: number, y: number) => number | undefined, left: number, top: number) => {
    let count = 0;
    for (let y = top; y < top + 27; y++) for (let x = left; x < left + 60; x++) if (alpha(x, y)) count++;
    return count;
  };

  it("paints a mask inside its own box and nowhere else", async () => {
    const { mask } = await segmentOf(`<0f>${record(0, 211, 228)}\n`);
    const alpha = alphaAt(mask.value);
    expect(covered(alpha, 211, 228)).toBeGreaterThan(0);
    expect(alpha(210, 228)).toBe(0);
    expect(alpha(271, 254)).toBe(0);
    expect(alpha(211, 255)).toBe(0);
    expect(alpha(0, 0)).toBe(0);
  });

  it("keeps every object, and overlapping objects combine into one region", async () => {
    const one = await segmentOf(`<0f>${record(0, 211, 228)}\n`);
    const { boxes, mask } = await segmentOf(`<0f>${record(0, 211, 228)},${record(2, 231, 238)},${record(5, 900, 500)}\n`);
    expect(boxes).toHaveLength(3);
    const alpha = alphaAt(mask.value);
    expect(covered(alpha, 900, 500)).toBe(covered(alphaAt(one.mask.value), 211, 228));
    expect(covered(alpha, 211, 228)).toBeGreaterThanOrEqual(covered(alphaAt(one.mask.value), 211, 228));
  });

  it.each([
    ["coordinates from a different frame size", SAM_TEXT.replace("w=1600", "w=640")],
    ["a box with no frame size", SAM_TEXT.replace(";w=1600;h=1200", "")],
    ["one good record beside a damaged line", `${SAM_TEXT}<1f>broken\n`],
    ["a raster that does not match its box", SAM_TEXT.replace("x2=270", "x2=280")],
    ["truncated output", SAM_TEXT.slice(0, SAM_TEXT.indexOf("data=") + 12)],
  ])("rejects %s rather than drawing it", async (_name, text) => {
    reply(metaReply(text));
    const response = await segment(USER_KEY);
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("INVALID_RESPONSE");
  });

  it("whitespace-only output is no match, while text with no masks is malformed", async () => {
    expect((await segmentOf(" \n")).boxes).toEqual([]);
    reply(metaReply("I cannot find that."));
    expect((await (await segment(USER_KEY)).json()).error.code).toBe("INVALID_RESPONSE");
  });
});

describe("SAM segmentation", () => {
  it("sends the documented request and normalizes output into the contract", async () => {
    reply(metaReply(SAM_TEXT));
    const response = await segment(USER_KEY, "discolored patch");
    const parsed = SegmentResponseSchema.parse(await response.json());
    if (!parsed.ok) throw new Error("expected success");

    const body = sentBody();
    expect(body).toMatchObject({ model: "sam-3.1", store: false });
    expect(body.input[0].content[0]).toEqual({ type: "input_text", text: "discolored patch" });
    expect(body.input[0].content[1].image_url).toMatch(/^data:image\/jpeg;base64,/);

    const { segmentation } = parsed;
    expect(segmentation.boxes).toEqual([{ x: 211, y: 228, width: 60, height: 27 }]);
    expect([segmentation.imageWidth, segmentation.imageHeight]).toEqual([1600, 1200]);
    expect(segmentation.mask.format).toBe("alpha-png-data-url");
    expect(segmentation.provenance).toMatchObject({ source: "LIVE_META", provider: "meta", model: "sam-3.1", requestId: "req-1" });
    expect(segmentation.provenance.fixtureId).toBeUndefined();
  });

  it("treats empty output as no match, with an empty mask and no boxes", async () => {
    reply(metaReply(""));
    const parsed = SegmentResponseSchema.parse(await (await segment(USER_KEY)).json());
    expect(parsed.ok && parsed.segmentation.boxes).toEqual([]);
  });

  it.each([
    ["text with no masks", metaReply("not a segmentation")],
    ["a corrupt mask payload", metaReply("<0f>0<|box;x1=1;y1=1;x2=9;y2=9;w=1600;h=1200|><|mask;x=0;y=0;data=9,9,~!!|>\n")],
    ["a box outside the image", metaReply(SAM_TEXT.replace("x1=211", "x1=5000").replace("x2=270", "x2=5059"))],
    ["no message item", { status: "completed", output: [] }],
    ["the wrong shape", { unexpected: "shape" }],
    ["non-JSON", "<html>nope</html>"],
  ])("rejects %s as INVALID_RESPONSE", async (_name, body) => {
    reply(body);
    const response = await segment(USER_KEY);
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("INVALID_RESPONSE");
  });

  it("refuses an oversized prompt without calling Meta", async () => {
    const response = await segment(USER_KEY, "x".repeat(201));
    expect((await response.json()).error.code).toBe("UNSUPPORTED_INPUT");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Muse Spark extraction", () => {
  it("asks for strict structured output and anchors the issue on the trusted scenario", async () => {
    reply(metaReply(museText({ location: "Somewhere the model made up", id: "model-id", status: "confirmed" })));
    const parsed = ExtractResponseSchema.parse(await (await extract(USER_KEY)).json());
    if (!parsed.ok) throw new Error("expected success");

    const body = sentBody();
    expect(body).toMatchObject({ model: "muse-spark-1.3", store: false });
    expect(body.text.format).toMatchObject({ type: "json_schema", strict: true });
    expect(body.text.format.schema.additionalProperties).toBe(false);

    expect(parsed.issue).toMatchObject({ id: "issue-demo-001", location: "Level 2 / North corridor", status: "needs_review" });
    expect(parsed.issue.provenance).toEqual([
      expect.objectContaining({ source: "LIVE_META", model: "muse-spark-1.3", requestId: "req-1" }),
    ]);
  });

  it.each([
    ["non-JSON output", "not json", "INVALID_RESPONSE", 502],
    ["a schema mismatch", museText({ urgency: "panic" }), "INVALID_RESPONSE", 502],
    ["evidence from elsewhere", museText({ evidence: [{ kind: "transcript", ref: "transcript-other", supports: "x" }] }), "INVALID_RESPONSE", 502],
    ["a safety claim", museText({ description: "The ceiling is safe to use." }), "SAFETY_REVIEW_REQUIRED", 422],
  ])("rejects %s with no issue", async (_name, text, code, status) => {
    reply(metaReply(text));
    const response = await extract(USER_KEY);
    const body = await response.json();
    expect(response.status).toBe(status);
    expect(body.error.code).toBe(code);
    expect(body.issue).toBeUndefined();
  });
});

describe("Muse Spark draft limits", () => {
  const evidence = (supports: string) => [{ kind: "transcript", ref: transcriptRef(SCENARIO), supports }];

  it.each([
    ["a disallowed claim in evidence text", { evidence: evidence("Shows the stain was caused by a roof leak.") }, "SAFETY_REVIEW_REQUIRED", 422],
    ["an over-long title", { title: "x".repeat(201) }, "INVALID_RESPONSE", 502],
    ["an over-long description", { description: "very ".repeat(500) }, "INVALID_RESPONSE", 502],
    ["an over-long unknown", { unknowns: ["x".repeat(501)] }, "INVALID_RESPONSE", 502],
    ["too many unknowns", { unknowns: Array.from({ length: 21 }, (_, i) => `unknown ${i}`) }, "INVALID_RESPONSE", 502],
    ["no unknowns", { unknowns: [] }, "INVALID_RESPONSE", 502],
    ["no evidence", { evidence: [] }, "INVALID_RESPONSE", 502],
    ["an image region it cannot have", { evidence: [{ kind: "image_region", ref: "seg-1", supports: "x" }] }, "INVALID_RESPONSE", 502],
    ["a category outside the enum", { category: "plumbing" }, "INVALID_RESPONSE", 502],
  ])("rejects %s", async (_name, overrides, code, status) => {
    reply(metaReply(museText(overrides)));
    const response = await extract(USER_KEY);
    const body = await response.json();
    expect(response.status).toBe(status);
    expect(body.error.code).toBe(code);
    expect(body.issue).toBeUndefined();
  });

  it("collapses exact repeats but keeps every distinct unknown", async () => {
    const supports = evidence("reported location");
    reply(metaReply(museText({ unknowns: ["source of mark", "Source of mark", "safety status"], evidence: [...supports, ...supports] })));
    const parsed = ExtractResponseSchema.parse(await (await extract(USER_KEY)).json());
    if (!parsed.ok) throw new Error("expected success");
    expect(parsed.issue.unknowns).toEqual(["Source of mark", "safety status"]);
    expect(parsed.issue.evidence).toHaveLength(1);
  });

  it("keeps an unknown that only asks about safety", async () => {
    reply(metaReply(museText({ unknowns: ["whether it is safe to use"] })));
    expect((await extract(USER_KEY)).status).toBe(200);
  });

  it("empty output and truncated JSON are not issues", async () => {
    for (const text of ["", museText().slice(0, 40)]) {
      reply(metaReply(text));
      expect((await (await extract(USER_KEY)).json()).error.code).toBe("INVALID_RESPONSE");
    }
  });

  it("ignores identity fields from the model", async () => {
    reply(metaReply(museText({ assetLabel: "MADE-UP", scenarioId: "other", provenance: [] })));
    const parsed = ExtractResponseSchema.parse(await (await extract(USER_KEY)).json());
    if (!parsed.ok) throw new Error("expected success");
    expect(parsed.issue).toMatchObject({ assetLabel: "CEILING-ZONE-N2", scenarioId: SCENARIO });
    expect(parsed.issue.provenance).toHaveLength(1);
  });
});

describe("upstream failures", () => {
  it.each([
    ["HTTP 429", 429, "RATE_LIMITED", 429],
    ["HTTP 500", 500, "UPSTREAM_ERROR", 502],
  ])("maps %s", async (_name, upstream, code, status) => {
    reply({ error: "x" }, upstream);
    const response = await extract(USER_KEY);
    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
  });

  it.each([400, 413])("maps HTTP %i to UNSUPPORTED_INPUT and does not quote Meta's message", async (upstream) => {
    reply({ error: { message: "secret detail about the request" } }, upstream);
    const response = await segment(USER_KEY);
    const text = await response.text();
    expect(response.status).toBe(400);
    expect(JSON.parse(text).error.code).toBe("UNSUPPORTED_INPUT");
    expect(text).not.toContain("secret detail");
  });

  it.each([408, 504])("maps HTTP %i to TIMEOUT", async (upstream) => {
    reply({ error: "x" }, upstream);
    expect((await (await extract(USER_KEY)).json()).error.code).toBe("TIMEOUT");
  });

  it("maps a stall while reading the body to TIMEOUT", async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, headers: new Headers(), text: () => Promise.reject(new DOMException("timed out", "TimeoutError")) });
    expect((await (await extract(USER_KEY)).json()).error.code).toBe("TIMEOUT");
  });

  it("maps an incomplete response, which is how Meta reports truncation", async () => {
    reply({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [{ type: "reasoning", summary: [] }] });
    const body = await (await extract(USER_KEY)).json();
    expect(body.error.code).toBe("UPSTREAM_ERROR");
    expect(body.issue).toBeUndefined();
  });

  it("reads past a reasoning item, as Meta's real responses have one first", async () => {
    reply({ ...metaReply(museText()), output: [{ type: "reasoning", summary: [] }, ...metaReply(museText()).output] });
    expect((await extract(USER_KEY)).status).toBe(200);
  });

  it("an empty request ID header becomes null, not an invalid value", async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(metaReply(museText())), { headers: { "x-request-id": "" } }));
    const parsed = ExtractResponseSchema.parse(await (await extract(USER_KEY)).json());
    expect(parsed.ok && parsed.issue.provenance[0]!.requestId).toBeNull();
  });

  it("uses the configured budget, and ignores a nonsense value", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    reply(metaReply(museText()));
    vi.stubEnv("META_API_TIMEOUT_MS", "1234");
    await extract(USER_KEY);
    vi.stubEnv("META_API_TIMEOUT_MS", "soon");
    await extract(USER_KEY);
    expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([1234, 60_000]);
  });

  it("maps a timeout to TIMEOUT", async () => {
    fetchMock.mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    const response = await extract(USER_KEY);
    expect(response.status).toBe(504);
    expect((await response.json()).error.code).toBe("TIMEOUT");
  });

  it("maps a response that did not complete", async () => {
    reply({ status: "failed", output: [] });
    expect((await (await extract(USER_KEY)).json()).error.code).toBe("UPSTREAM_ERROR");
  });

  it("maps a refusal rather than reading it as no match", async () => {
    reply({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", text: "no" }] }] });
    expect((await (await segment(USER_KEY)).json()).error.code).toBe("UPSTREAM_ERROR");
  });
});

describe("alphaPngDataUrl", () => {
  it("writes the raster as alpha, row by row", () => {
    const png = Buffer.from(alphaPngDataUrl(Uint8Array.from([1, 0, 0, 1]), 2, 2).split(",")[1]!, "base64");
    expect(png.readUInt32BE(16)).toBe(2);
    expect(png.readUInt32BE(20)).toBe(2);
    const idatLength = png.readUInt32BE(33);
    const pixels = inflateSync(png.subarray(41, 41 + idatLength));
    expect([...pixels]).toEqual([0, 255, 255, 255, 0, 0, 255, 0, 255, 255]);
  });
});
