# Parallel Workstream Contract

## Purpose

This document is the coordination contract for parallel coding agents. It prevents conflicting framework choices, duplicate domain models, and integration churn.

## Product and non-negotiable constraints

- Product: FixFrame — evidence-to-reviewable-maintenance-work-order prototype.
- Entirely synthetic demo data. Never claim real users, incidents, validation, ROI, accuracy, or safety outcomes.
- A human must confirm/edit an issue before work-order creation.
- Never infer root cause, safety state, asset identity, or hazardous repair instructions from imagery.
- Explicit provenance: `LIVE_META`, `DEMO_FIXTURE`, `USER_EDIT`.
- Live provider failure must never silently become fixture success.
- Repository must independently build; no dependency on private Appdraft source.

## Stack decision (freeze this)

Use **Next.js App Router + TypeScript + React**, with:
- Tailwind CSS for styling.
- Zod for runtime validation.
- Vitest for unit/integration tests.
- Playwright for the single end-to-end happy path if time permits.
- ESLint + TypeScript strict mode.
- Server route handlers for model calls; never call Meta APIs from browser.
- In-memory/local deterministic demo state for the first milestone; persistence is optional and must not block the demo.

Do not introduce another framework, database, state library, component library, or ORM without an architecture decision from the integration owner.

## Frozen shared contracts

Canonical concepts and fields are defined in ARCHITECTURE.md. Before implementation, create a single source of truth in `src/lib/contracts.ts` (or `src/lib/contracts/index.ts`) containing Zod schemas and inferred TS types for:
- Scenario
- EvidenceRef
- Provenance
- Issue
- WorkOrder
- ChecklistItem
- WorkOrderEvent
- ProviderError

Rules:
- Domain contracts are owned by Workstream C.
- Workstreams A and B import these types; they must not redeclare parallel versions.
- Changes to field names/enums require a short ADR in `docs/decisions/` and explicit notice to all agents.
- Use ISO timestamp strings.
- Do not use an uncalibrated numeric confidence score.
- Use only controlled enums in ARCHITECTURE.md.
- Model-generated data is untrusted; validate on server before returning it.

## Workstream ownership

### A — Frontend experience (exclusive ownership)
Owns:
- `src/app/**` page/layout and route-independent UI composition
- `src/components/**`
- `src/styles/**` if needed
- frontend-specific tests in `src/components/**/*.test.tsx`

Must:
- Build scenario gallery, evidence workspace, image/mask overlay, transcript panel, review/edit form, work-order view, checklist/status/feedback, audit timeline.
- Include prominent synthetic-data banner.
- Display provenance labels and error states.
- Support keyboard focus and responsive desktop layout.
- Consume shared contracts and the API contract below.
- Use deterministic fixture endpoints for the complete happy path while B works on live providers.

Must not:
- Implement Meta API calls or access secrets.
- Define domain schemas.
- silently fabricate live output.
- change route/API contracts without coordination.

### B — Meta API and provider adapters (exclusive ownership)
Owns:
- `src/server/providers/**`
- `src/app/api/segment/route.ts`
- `src/app/api/extract/route.ts`
- `src/server/env.ts`
- provider integration tests under `src/server/providers/**`

Must:
- Implement explicit fixture and live providers behind the same interfaces.
- Implement SAM 3.1 segmentation and Muse Spark 1.3 extraction using current official docs.
- Keep API key server-side.
- Validate requests and provider responses.
- Return explicit provenance and structured errors.
- Never silently fall back from live to fixture.
- Verify actual request/response shape from official docs before coding.

Must not:
- build UI components,
- redefine domain contracts,
- add audio transcription unless both core live integrations work and time remains,
- claim live calls without actually making them.

### C — Domain, synthetic data and workflow (exclusive ownership)
Owns:
- `src/lib/contracts.ts` and related domain modules under `src/lib/domain/**`
- `src/data/**`
- `public/demo-assets/**`
- workflow state machine and reducer/service under `src/lib/workflow/**`
- domain tests under `src/lib/**/*.test.ts`

Must:
- Implement canonical Zod schemas/types.
- Implement three synthetic scenarios and authored transcripts.
- Create or source legally redistributable synthetic images; document every asset in `assets/README.md`.
- Implement stable fixture outputs, including fixture IDs and `DEMO_FIXTURE` provenance.
- Implement issue confirmation, work-order creation, allowed status transitions, checklist, feedback, and audit events.
- Preserve unknowns and evidence references.

Must not:
- call Meta API,
- build React page/component UI,
- create arbitrary repair procedures,
- change frozen stack or API response shape without an ADR.

### D — QA, CI and submission (exclusive ownership)
Owns:
- `.github/workflows/**`
- `playwright.config.*`, Vitest config only if absent and coordinated
- `docs/QA_REPORT.md`, `docs/RELEASE_NOTES.md`, test scripts and CI support
- integration/e2e tests under `tests/**`
- documentation updates outside A/B/C owned source paths

Must:
- Establish CI for lint, typecheck, tests, and build.
- Add acceptance/e2e tests against agreed API and domain contracts.
- Test explicit fixture/live provenance and no hidden fallback.
- Validate fresh-clone setup and document exact commands.
- Prepare public release checks, asset/license inventory, and demo capture checklist.

Must not:
- duplicate domain schemas,
- modify app architecture or model adapters,
- block implementation waiting for live credentials; fixture-mode tests are required first.

### Integration owner — ChatGPT / repository maintainer
Owns architecture decisions, shared contract arbitration, integration order, review checklists, demo narrative, and final release gate. Agents must report blockers and avoid editing files owned by another workstream.

## API contract for frontend and provider agents

The frontend should call same-origin routes:

### POST /api/segment
Request:
```json
{ "scenarioId": "water-ingress-01", "prompt": "discoloured ceiling tile" }
```
Response:
```json
{
  "ok": true,
  "segmentation": {
    "id": "seg-demo-001",
    "imageWidth": 1280,
    "imageHeight": 720,
    "mask": { "format": "alpha-png-data-url-or-public-path", "value": "..." },
    "boxes": [],
    "provenance": {
      "source": "DEMO_FIXTURE",
      "provider": "fixture",
      "model": "fixture-sam",
      "operation": "segmentation",
      "createdAt": "ISO-8601",
      "fixtureId": "water-ingress-01-mask-v1"
    }
  }
}
```
Live SAM responses may use a different internal representation, but the route must normalize them into this stable client-facing contract. Do not return arbitrary provider payloads to the browser.

### POST /api/extract
Request:
```json
{ "scenarioId": "water-ingress-01" }
```
Response:
```json
{
  "ok": true,
  "issue": {
    "id": "issue-demo-001",
    "scenarioId": "water-ingress-01",
    "title": "Discoloured ceiling tile observed",
    "description": "A discoloured patch is visible. Its source and cause are unknown.",
    "location": "Level 2 / North corridor",
    "assetLabel": "CEILING-ZONE-N2",
    "category": "building_fabric",
    "urgency": "review",
    "status": "needs_review",
    "evidence": [],
    "unknowns": ["source of mark", "hidden extent", "safety status"],
    "provenance": []
  }
}
```
The canonical Issue schema in `src/lib/contracts.ts` is authoritative; these examples illustrate transport shape, not a second schema.

Errors use:
```json
{ "ok": false, "error": { "code": "UNCONFIGURED", "message": "Live provider is not configured." } }
```
Codes: `UNCONFIGURED`, `TIMEOUT`, `RATE_LIMITED`, `UPSTREAM_ERROR`, `INVALID_RESPONSE`, `UNSUPPORTED_INPUT`, `SAFETY_REVIEW_REQUIRED`.

## Git workflow and conflict avoidance

- Default integration branch: `main`.
- Each agent works on a dedicated branch: `agent/frontend`, `agent/meta-providers`, `agent/domain-data`, `agent/qa-release`.
- Open a PR into main; do not push directly to main.
- Do not cherry-pick or force-push shared branch history.
- Keep commits small and include tests.
- Only Workstream C may create/change shared contracts. If another agent needs a contract change, open a request/ADR; do not edit it independently.
- Workstream A can begin using mocked route responses matching this contract.
- Workstream B can implement route handlers using C's fixtures/contracts.
- Workstream D can write tests from the contract before implementation lands, but must not invent new schema fields.
- Integration order: C contracts + fixtures first; A and B can work in parallel against the frozen contract; D builds CI/tests in parallel; merge only after checks pass.
- If all agents must start immediately, create branches from the same latest main commit and keep ownership boundaries strict. Rebase/merge main before PR only if safe; ask integration owner if conflicts occur.

## Agent handoff report (required)

At completion, each agent must report:
1. branch name and commits,
2. files changed,
3. commands actually run,
4. tests/build results (do not claim tests not run),
5. screenshots or short screen recording if UI work,
6. known limitations,
7. any contract changes requested,
8. exact next action/blocker.

## Definition of integrated

A workstream is not done merely because files exist. It is done when its branch builds/tests, its contract matches this document, its PR is reviewed, and the end-to-end fixture flow still works after integration.
