# FixFrame — Test and Acceptance Plan

## Unit tests
- Issue schema validates required fields and rejects unknown enum values.
- Evidence references resolve to scenario inputs.
- Provenance source is one of `LIVE_META`, `DEMO_FIXTURE`, `USER_EDIT`.
- Unsafe claims (cause, safety certification, hazardous repair instruction) are not silently accepted.
- Work-order transitions follow allowed graph.
- Checklist completion and feedback create audit events.
- Scenario and asset references cannot be supplied by untrusted model output.

## Integration tests
- Fixture segmentation produces stable, clearly labelled region output.
- Fixture extraction produces schema-valid issue.
- Invalid provider response returns `INVALID_RESPONSE` and creates no work order.
- Timeout/rate limit/provider errors appear in UI; no hidden fixture substitution.
- User can correct issue and create a work order.
- Work order persists on refresh if persistence is implemented; otherwise limitation is documented.

## Live smoke tests
Run only with explicit credentials:
- SAM 3.1 request succeeds on supported synthetic image.
- Segmentation decodes and renders without coordinate corruption.
- Muse Spark request succeeds using a currently supported documented image/text interface.
- Response parses and validates.
- Model ID, operation, timestamp, request ID (where available) persisted.
- Secrets absent from browser responses, logs, artifacts, and git history.

## Acceptance matrix

| ID | Test | Expected result |
|---|---|---|
| A1 | Clean clone, no API keys | App starts in deliberate fixture mode |
| A2 | Select synthetic scenario | Correct image, transcript, metadata |
| A3 | Fixture segmentation | Overlay visible with fixture provenance |
| A4 | Fixture extraction | Issue passes schema validation |
| A5 | Edit title/location/urgency | Values persist and show user-edit provenance |
| A6 | Create work order | Safe checklist and acceptance criteria appear |
| A7 | Complete checklist item | Item and timeline update |
| A8 | Update status/add feedback | State and feedback persist |
| A9 | Force model timeout | Clear error; no hidden fallback |
| A10 | Malformed model output | Rejected; cannot create work order |
| A11 | Live provider call | Live badge only after successful call |
| A12 | Keyboard navigation | Core flow remains operable |

## Quality gates

Before recording: clean clone setup verified, build/tests pass, assets labelled synthetic, provenance correct, no dead-end interactions in narrated path, no fabricated benchmarks.

Before public release: secret scan and manual history review, dependency/license review, asset source/license review, selected OSS license, exact setup commands, no private package dependency.
