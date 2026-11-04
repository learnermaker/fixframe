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

## Implementation order

1. Build provider interfaces and explicit fixture provider.
2. Implement one SAM 3.1 live call and verify mask decode/render.
3. Implement one Muse Spark 1.3 live call and validate extraction schema.
4. Add optional Voice Transcribe only if time remains.
5. Verify errors, timeout handling, secret handling, and provenance.
6. Re-check official docs and update this note immediately before submission.

## Claims discipline

A working API request does not establish accuracy, safety, commercial impact, or real-world suitability. Use the models only for the bounded demo tasks described in this repository.
