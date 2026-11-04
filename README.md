# FixFrame

**From visual evidence to a reviewable maintenance workflow.**

FixFrame is a hackathon prototype that turns a maintenance observation into a structured, editable work order. A user selects a clearly labelled synthetic scenario, reviews a photo and a prerecorded demo transcript, gets image-region segmentation and AI-assisted issue extraction, confirms or corrects the facts, and tracks the work order through a simple lifecycle.

> **Demo-only project.** All sites, assets, people, observations, equipment IDs, transcripts, work orders, and outcomes in this repository are fictional or synthetic. They are not evidence of customer use, field validation, real incidents, or actual maintenance outcomes.

## Product flow

1. Choose a synthetic scenario.
2. Inspect its source photograph and demo transcript.
3. Use SAM 3.1 to highlight a relevant region.
4. Extract a structured observation with Muse Spark.
5. Review and edit the facts, location, category, and urgency.
6. Create a work order with an administrative checklist, owner, status, and acceptance criteria.
7. Update progress and add reviewer feedback.

## Why it matters

Maintenance observations often begin as unstructured evidence: a photo, a spoken note, and a location. FixFrame demonstrates a path from those inputs to a reviewable work item while preserving the source evidence and keeping a human responsible for the final classification and approval.

This is not a CMMS, safety certification tool, diagnostic authority, or autonomous repair system.

## Meta AI use

- **SAM 3.1:** segmentation / visual region identification.
- **Muse Spark:** multimodal interpretation and schema-constrained issue extraction.
- **Transcription:** prerecorded synthetic transcript is the reliable baseline; live transcription is optional and must be verified against current official API documentation.
- **Fixture mode:** available for repeatable local demos and tests. Fixture output must always be visibly labelled and never represented as a live model result.

Actual model IDs, endpoints, payloads, schemas, and limits must be verified against current official Meta documentation before implementation. Do not invent API behavior.

## Repository status

A working prototype: a Next.js app with a full synthetic fixture flow, live SAM 3.1 / Muse Spark providers behind explicit configuration, and an automated acceptance and browser test suite. What was and was not verified is recorded, with dates and commands, in [docs/QA_REPORT.md](docs/QA_REPORT.md); release status is in [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md). Read those rather than taking this paragraph's word for it.

- [PLAN.md](PLAN.md) — priorities, work packets, and acceptance gates.
- [ARCHITECTURE.md](ARCHITECTURE.md) — component design, data contracts, provenance, and safety.
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — three-minute walkthrough.
- [docs/DEMO_DATA.md](docs/DEMO_DATA.md) — synthetic scenario policy.
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md) — test and acceptance matrix.
- [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) — release gate.
- [docs/DEMO_CAPTURE_CHECKLIST.md](docs/DEMO_CAPTURE_CHECKLIST.md) — recording checklist.
- [docs/decisions/](docs/decisions/) — accepted design decisions (domain contract, bring-your-own key).

## Principles

- Human confirmation is mandatory before creating a work order.
- Never infer a real-world cause, asset identity, safety condition, or repair procedure solely from a photo.
- Do not provide instructions for electrical, structural, pressure, chemical, fire, or other hazardous systems.
- Preserve the original source image, transcript, segmentation, model response, and human edits.
- Distinguish live model output, deterministic fixtures, and user-entered facts.
- Do not claim validation, time saved, ROI, or improved safety from synthetic scenarios.

## Setup

Needs Node 20.15 or newer (CI uses 24). The demo needs no API credentials.

```bash
npm ci
cp .env.example .env
npm run build
npm start
```

Open http://localhost:3000. `npm run dev` runs the development server instead.

`FIXFRAME_PROVIDER_MODE` picks where results come from. `fixture` returns the labelled demo data in this repository and calls no model. `live` calls SAM 3.1 and Muse Spark 1.3 with `META_API_TOKEN`, or with a key the user enters for their session. With neither it answers `UNCONFIGURED`. It never falls back to demo data, and any mode other than `fixture` counts as live.

Checks: `npm run lint`, `npm run typecheck`, `npm test`. The acceptance and browser suites live in `tests/`; see [tests/README.md](tests/README.md).

The build downloads the Barlow fonts from Google Fonts (`next/font/google`), so it needs network access.

### Using a Meta API key safely

- Set `META_API_TOKEN` only in a local `.env` or your host's secret store. `.env` is git-ignored; never commit a key, put it in a `NEXT_PUBLIC_*` variable, or paste it into an issue, screenshot or recording.
- A visitor can instead enter their own key in live mode. It is held in browser memory only, sent as the `X-FixFrame-Meta-Key` header to this server, forwarded to Meta and not stored by FixFrame, but whoever operates the server could read it in transit. Do not enter a key on a server you do not trust ([ADR 0002](docs/decisions/0002-byok-meta-api-key.md)).
- Calling Meta is governed by your own Meta account terms. A key that has been pasted into a chat or ticket should be treated as exposed and rotated.
- `tests/` has a manual live smoke test (`FIXFRAME_LIVE_KEY=... npm run live-smoke --prefix tests`) that makes three real calls; it is never run in CI.

## Contributing and security

Open an issue or pull request. CI (lint, typecheck, unit tests, build, acceptance, Playwright, and a full-history secret scan) must pass. Do not include real credentials or real maintenance data in anything you submit. To report a security problem, contact the maintainer privately instead of opening a public issue.

## License

Source code and documentation: [MIT](LICENSE). The synthetic demo images and masks are CC0 1.0 ([assets/README.md](assets/README.md)). Third-party packages keep their own licences, and one runtime dependency, `@meta-sam/parser`, is under Meta's custom SAM License rather than an OSI licence: see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before redistributing a build. This is an inventory, not legal advice.
