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

The initial product and engineering specification is being established. See:
- [PLAN.md](PLAN.md) — priorities, work packets, and acceptance gates.
- [ARCHITECTURE.md](ARCHITECTURE.md) — component design, data contracts, provenance, and safety.
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — three-minute walkthrough.
- [docs/DEMO_DATA.md](docs/DEMO_DATA.md) — synthetic scenario policy.
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md) — test and acceptance matrix.
- [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) — release gate.

## Principles

- Human confirmation is mandatory before creating a work order.
- Never infer a real-world cause, asset identity, safety condition, or repair procedure solely from a photo.
- Do not provide instructions for electrical, structural, pressure, chemical, fire, or other hazardous systems.
- Preserve the original source image, transcript, segmentation, model response, and human edits.
- Distinguish live model output, deterministic fixtures, and user-entered facts.
- Do not claim validation, time saved, ROI, or improved safety from synthetic scenarios.

## Setup

Needs Node 20.9 or newer (CI uses 24). The demo needs no API credentials.

```bash
npm ci
cp .env.example .env
npm run build
npm start
```

Open http://localhost:3000. `npm run dev` runs the development server instead.

`FIXFRAME_PROVIDER_MODE` picks where results come from. `fixture` returns the labelled demo data in this repository and calls no model. `live` is for Meta's models, and this build has no live provider yet, so it answers `UNCONFIGURED` rather than falling back to demo data.

Checks: `npm run lint`, `npm run typecheck`, `npm test`. The acceptance and browser suites live in `tests/`; see [tests/README.md](tests/README.md).

## License

Private during development. Before public release, choose and add an appropriate OSI-approved license and verify all code and asset redistribution rights.
