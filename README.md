# FixFrame

**From visual evidence to human-verified maintenance action.**

[![CI](https://github.com/learnermaker/fixframe/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/learnermaker/fixframe/actions/workflows/ci.yml)

FixFrame is an AI-assisted visual inspection workflow that turns an image and inspection context into structured, reviewable maintenance work. It combines **Meta SAM 3.1** for visual-region segmentation with **Muse Spark** for multimodal interpretation and structured issue extraction, then keeps a human in control of review, approval and work-order creation.


https://youtube.com/watch?v=Q0pm6j9wfuI&si=Dumj4t_BsZSvF88H

[Hackathon submission copy](docs/HACKATHON_SUBMISSION.md) · [Demo-data and safety policy](docs/DEMO_DATA.md) · [Photo credits and asset provenance](assets/demo-evidence/README.md) · [Meta API implementation notes](docs/META_API_NOTES.md)

## The workflow

**OBSERVE → UNDERSTAND → VERIFY → ACT**

1. Select one of five inspection scenarios.
2. Review the image and its accompanying inspection note.
3. Ask SAM 3.1 to segment a relevant visual region.
4. Ask Muse Spark to interpret the image and context and return structured issue information.
5. Review the draft, evidence, unknowns and provenance; edit or reject unsupported details.
6. Explicitly confirm the reviewed finding before creating a work order.
7. Track the work order through checklist updates, status changes and reviewer feedback.

FixFrame is deliberately more than a defect-detection demo: it demonstrates a controlled path from multimodal observations to a human-reviewed, traceable operational task.

## What Meta models do

- **Meta SAM 3.1:** identifies and segments image regions using a text prompt.
- **Muse Spark:** interprets the image together with inspection context and produces structured issue information for human review.
- **Meta Model API:** provides access to the live model capabilities used by the application.

The application distinguishes `LIVE_META`, `DEMO_FIXTURE` and `USER_EDIT` provenance. Fixture mode supports repeatable demonstrations and tests. A live provider failure is surfaced as an error; it must not silently fall back to fixture output.

## Demo scenarios and data

The repository includes five inspection scenarios covering ceiling discolouration, a cable-sheath mark, a handrail bracket, pipework corrosion and concrete deterioration.

Scenario sites, asset labels, transcripts, people, work orders and maintenance records are fictional. The visual inputs include three credited third-party photographs and two authored illustrations. The photographs are visual examples only; they are not evidence of a FixFrame customer site, incident or maintenance outcome. See [the demo-data policy](docs/DEMO_DATA.md) and [asset provenance register](assets/demo-evidence/README.md).

## Verification snapshot

- The GitHub Actions CI workflow passed on the current `main` commit at the time this README was updated. It ran root install, lint, typecheck, unit tests, production build, test-package install/typecheck, API acceptance and Playwright E2E.
- The provider hardening work records live SAM and Muse calls through FixFrame's own routes. The subsequent photo integration PR reports successful live SAM and Muse responses for all five scenarios, each run once. Model output varies; these smoke tests do not establish real-world accuracy.
- The full-history Gitleaks scan from the open QA follow-up is not yet part of the current `main` workflow. Do not interpret the green CI badge as evidence that a full-history secret scan has passed.

See [the QA report](docs/QA_REPORT.md) for the current verification evidence and limitations.

## Safety and scope

FixFrame is a hackathon demonstration, not a CMMS, diagnostic authority, safety certification system or autonomous repair tool. A photograph cannot establish root cause, hidden condition, structural integrity, electrical state or whether equipment is safe. Model-generated findings are suggestions; a person must review and explicitly confirm them before a work order is created. The scenarios do not establish real-world accuracy, safety improvement, time savings or ROI.

## Run locally

Requirements: Node.js 20.15 or newer.

```bash
npm ci
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production build:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

The demo can run in fixture mode without Meta credentials. To use live providers, configure `FIXFRAME_PROVIDER_MODE=live` and a server-side `META_API_TOKEN`, or enter a supported key for the current session in the application. Do not commit credentials. Live calls may incur API usage and model outputs can vary.

See `.env.example`, [the Meta API implementation notes](docs/META_API_NOTES.md) and [tests/README.md](tests/README.md) for configuration and verification details.

## Technology

- Next.js, React and TypeScript
- Zod domain contracts and validated API responses
- Meta SAM 3.1 and Muse Spark via Meta Model API
- Server-side provider boundary with request-scoped BYOK support
- Vitest, API acceptance tests and Playwright

## Licensing and third-party materials

Original FixFrame source code and project documentation are licensed under the [MIT License](LICENSE), subject to the exclusions and separate terms documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). In particular, the SAM parser is distributed under Meta's separate SAM License, and the demo photographs retain their individual licences. The root MIT License does not grant rights to third-party media, dependencies, Meta models or hosted services. Review the third-party notices before reusing or redistributing any of those materials.
