# Meta Model API — Verified Integration Notes

Last checked: 2026-11-04. Re-check official docs before final implementation/submission because API schemas can change.

## Official references

- Overview: https://dev.meta.ai/docs/overview
- Models: https://dev.meta.ai/docs/models
- SAM overview: https://dev.meta.ai/docs/sam/overview
- Speech to text: https://dev.meta.ai/docs/speech-to-text

## Shared API

The official overview documents:
- Base URL: `https://api.meta.ai/v1`
- Bearer authentication using a Model API key.
- Muse Spark 1.3 model ID: `muse-spark-1.3`
- SAM 3.1 model ID: `sam-3.1`
- Muse Voice Transcribe model ID: `muse-voice-transcribe-1.0`

Keep credentials exclusively server-side. The exact SDK request bodies, response parsing, media upload and structured-output options must be read from the relevant current API reference/quickstart before writing adapters. Do not infer these structures from model names or third-party examples.

## SAM 3.1

Official SAM overview describes text-prompted object detection and segmentation. It returns boxes and masks, can work with still images/video, and the documented still/video call uses `POST /v1/responses` against `https://api.meta.ai/v1`. SAM also documents file upload capability via `POST /v1/files`.

For this application:
- Input: synthetic scenario image and a short noun phrase describing the region of interest.
- Output: validated mask/box representation, converted to a frontend overlay.
- The mask is a region-of-interest aid, not evidence that an object is defective.
- If the output cannot be decoded/validated, show an error; do not fabricate a mask.

## Muse Spark 1.3

Official model documentation lists Muse Spark 1.3 as the current recommended model, with text, image, video and PDF input capabilities. It documents structured output and image understanding at the model level.

For this application:
- Input: supported image representation, synthetic transcript text, and tightly-scoped extraction instructions.
- Output: Issue fields conforming to ARCHITECTURE.md.
- Treat every generated factual statement as unconfirmed until linked to evidence or accepted by a user.
- Preserve unknowns and ask for missing information rather than guessing.
- Confirm the precise request format/structured-output schema using the live API reference before coding.

**Important audio note:** Meta's model documentation says Muse Spark 1.3 audio understanding is not fully supported and audio-containing requests may have degraded quality. Do not rely on direct audio input to Muse Spark for the demo.

## Muse Voice Transcribe 1.0

Official speech-to-text docs list:
- Model: `muse-voice-transcribe-1.0`
- File endpoint: `POST https://api.meta.ai/v1/asr/transcribe` using multipart upload and Authorization header.
- Realtime endpoint: `wss://api.meta.ai/v1/asr/realtime`.

Audio transcription is optional. The reliable hackathon baseline remains prerecorded synthetic transcript text. If audio is added, use the dedicated transcription capability and feed its returned text into Muse Spark. Do not claim a prerecorded transcript was transcribed live.

## Verified behaviour of the live integration

Checked on 2026-11-04 against the pages below and real responses, through `src/server/providers/**`. Items marked *observed* come from real calls and are not stated in Meta's docs, so they could change without notice.

Docs: [segmenting](https://dev.meta.ai/docs/sam/segmenting), [reading segmentation](https://dev.meta.ai/docs/sam/reading-segmentation), [image understanding](https://dev.meta.ai/docs/image-understanding), [structured output](https://dev.meta.ai/docs/structured-output), [Responses](https://dev.meta.ai/docs/protocols/responses), [error handling](https://dev.meta.ai/docs/error-handling).

**Shared**
- `POST /v1/responses` with a bearer key. FixFrame sends `store: false` because Meta stores responses by default.
- Real responses have a `reasoning` item before the `message` item (*observed*, for Muse). Text is in `output[].content[]` parts of type `output_text`. The request ID is in the `x-request-id` header (*observed*).
- Truncation is HTTP 200 with `status: "incomplete"`, and may have no message item at all (*observed*).

| Meta answers | FixFrame returns | Reason |
|---|---|---|
| 400, 413 | `UNSUPPORTED_INPUT` | Meta says not to retry without changing the request |
| 401, 403 | `UPSTREAM_ERROR`, no other key tried | ADR 0002 |
| 408, 504 | `TIMEOUT` | Meta documents 504 as a request running too long |
| 429 | `RATE_LIMITED` | |
| Other non-2xx | `UPSTREAM_ERROR` | |
| 200, not `completed` | `UPSTREAM_ERROR` | Includes truncation |
| 200, unreadable | `INVALID_RESPONSE` | |

FixFrame does not retry automatically. The reviewer retries from the UI. Meta's message text is never passed on.

**SAM 3.1**
- Output is one `output_text` lane. An empty lane means no match and is a valid result. Text with no mask records is treated as malformed.
- `x2` and `y2` are inclusive on the wire, and `@meta-sam/parser` converts them to half-open bounds. Mask rasters cover their own box, not the frame, and matched the box size in every real response. Meta's page does not say this explicitly, so FixFrame rejects any raster that does not fit its box instead of scaling it.
- Every box repeats the frame size. FixFrame rejects a box whose frame differs from the image it sent.
- Prompts are short noun phrases for one concept. Lists return no matches. Spelling matters in practice: `discolored patch` matched while `discoloured patch` did not (*observed*).
- Overlapping objects are combined into one region, because the contract has one mask per segmentation. Meta's docs do not define overlap.
- The docs state no image size limit for SAM. The demo images are at most 1.45 MB and 1280x720.

**Muse Spark 1.3**
- Images go in the `user` message as `input_image` with a base64 data URL. PNG is supported, with a 50 MB inline limit.
- Structured output uses `text.format` on the Responses API. Output is always held to the schema, and `strict: true` also makes Meta validate the schema itself. The docs do not list `minItems`, `maxItems` or `maxLength`, so FixFrame checks limits itself after parsing.
- Evidence is transcript-only because `ExtractRequest` has no segmentation ID. Changing that needs an ADR.
- Location, asset, scenario and status always come from the scenario catalog through `issueFromModelOutput`.

## Live smoke test

Run against a production build with a real key available. Print shapes and status codes only, never a key.

1. `FIXFRAME_PROVIDER_MODE=live META_API_TOKEN=<key> npm start`, then `POST /api/segment` and `/api/extract` for each scenario, using its `segmentationPrompt`. Expect 200 with `LIVE_META` and a request ID.
2. Segment with a phrase that is not in the image. Expect 200 and no boxes.
3. Start with no `META_API_TOKEN` and send the key as `X-FixFrame-Meta-Key`. Expect 200.
4. With a good `META_API_TOKEN`, send a fake `X-FixFrame-Meta-Key`. Expect 502 `UPSTREAM_ERROR`.
5. Send no key at all with no `META_API_TOKEN`. Expect 503 `UNCONFIGURED`.
6. In the browser: segment, extract, confirm, create work order. Check for `LIVE_META` labels and no `DEMO_FIXTURE`.

Model output varies between runs. Passing shows the integration works, not that its output is accurate on real-world images.

## Test tiers

| When | Command |
|---|---|
| After each provider change | `npx vitest run src/server/providers` and `npx eslint src/server` |
| After a logical unit | The above, plus `npm run typecheck`. If route behaviour changed: `npm run build` and `META_API_TIMEOUT_MS=2000 npm run acceptance --prefix tests` |
| Before a PR is ready | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, the acceptance and browser suites, and the live smoke test where a key exists |

`META_API_TIMEOUT_MS` shortens how long the upstream-hang tests wait. Do not use a short value against the real API: Muse has taken up to 25 seconds.

## Implementation order

1. Build provider interfaces and explicit fixture provider.
2. Implement one SAM 3.1 live call and verify mask decode/render.
3. Implement one Muse Spark 1.3 live call and validate extraction schema.
4. Add optional Voice Transcribe only if time remains.
5. Verify errors, timeout handling, secret handling, and provenance.
6. Re-check official docs and update this note immediately before submission.

## Claims discipline

A working API request does not establish accuracy, safety, commercial impact, or real-world suitability. Use the models only for the bounded demo tasks described in this repository.
