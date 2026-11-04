# Coding Agent Prompts — Copy/Paste Assignments

Read `AGENT_WORKSTREAMS.md` first. It is the source of truth for ownership, stack, contracts, routes, and Git workflow. Read the other linked specs only as needed. Do not ask the user to restate requirements.

## Shared instruction (prepend to every agent prompt)

You are contributing to the private GitHub repository `learnermaker/fixframe`, a hackathon prototype. Read:
- `README.md`
- `AGENT_WORKSTREAMS.md`
- `PLAN.md`
- `ARCHITECTURE.md`
- `.github/AGENTS.md`

Follow ownership boundaries exactly. Use the frozen stack and shared contracts. All demo content is synthetic and must be labelled. Do not claim real-world validation or fabricate live model results. Do not edit another workstream's owned files. Work on your assigned branch, commit your changes, open a PR to `main`, and provide the required handoff report. If blocked by a missing contract, request a decision rather than inventing one.

---

## Agent A — Frontend experience

**Branch:** `agent/frontend`

Implement the complete FixFrame frontend experience as described in `AGENT_WORKSTREAMS.md` and `DEMO_SCRIPT.md`.

Read `docs/DEMO_DATA.md`, `docs/TEST_PLAN.md`, and `docs/SUBMISSION_CHECKLIST.md`.

Ownership: `src/app/**`, `src/components/**`, `src/styles/**`, frontend component tests.

Build:
1. A clear landing/workspace screen with a persistent `SYNTHETIC DEMO DATA` disclosure.
2. Scenario selector/gallery.
3. Evidence workspace with original image, image-region overlay, fictional location/asset metadata, and transcript.
4. Segmentation action calling `POST /api/segment`.
5. Extraction action calling `POST /api/extract`.
6. Structured issue review/edit form. Do not allow work-order creation before explicit human confirmation.
7. Work-order view with checklist, status, feedback and audit timeline.
8. Visible provenance chips for `LIVE_META`, `DEMO_FIXTURE`, and `USER_EDIT`.
9. Clear loading, unconfigured, timeout, invalid-response, and retry states.
10. Responsive, keyboard-operable UI with polished visual hierarchy.

Use mock responses matching the exact route contracts in `AGENT_WORKSTREAMS.md` if backend routes are not yet available. Do not implement API handlers or model calls. Import domain types from `src/lib/contracts.ts`; if C has not merged it yet, use a temporary local type-only shim in your branch and replace it before PR—do not create a competing canonical schema.

Acceptance:
- A judge can understand the product in the first 15 seconds.
- Full happy path works using fixture route responses.
- Synthetic status is always visible.
- The source image and model interpretation are visually distinguishable.
- No UI implies cause, safety clearance, or repair instruction.
- Core flow works at 1280x800 and narrow mobile width.
- Component tests cover review gating, provenance and errors.

Do not touch provider adapters, canonical domain contracts, scenario fixture data, CI, or model credentials.

---

## Agent B — Meta model integration

**Branch:** `agent/meta-providers`

Implement authentic Meta Model API provider adapters and route handlers. Read `docs/META_API_NOTES.md`, `ARCHITECTURE.md`, and the official Meta API docs linked from the notes.

Ownership: `src/server/providers/**`, `src/app/api/segment/route.ts`, `src/app/api/extract/route.ts`, `src/server/env.ts`, provider tests.

Tasks:
1. Implement a provider interface with fixture and live implementations.
2. Implement SAM 3.1 segmentation using the exact currently documented request and response schema.
3. Normalize validated output into the stable `POST /api/segment` response in `AGENT_WORKSTREAMS.md`.
4. Implement Muse Spark 1.3 extraction using the exact currently documented supported image/text interface.
5. Normalize and validate output using C's canonical Zod schemas; reject malformed/unsupported output.
6. Add explicit source/model/operation/timestamp/request ID/fixture ID provenance.
7. Keep credentials server-side; validate env vars; ensure no token is returned or logged.
8. Handle timeout, rate limit, provider error, malformed response and missing credentials.
9. Fixture mode must be explicit. Never silently fall back after a live provider failure.
10. Add tests with mocked HTTP responses and deterministic fixture provider.

Do not implement audio transcription until both core model calls are working. Do not send audio directly to Muse Spark. Do not create UI, scenarios, domain schemas, or workflow state.

Acceptance:
- Fixture endpoints work without credentials.
- Live SAM call can be run with a valid server-side key and synthetic image.
- Live Muse Spark call can be run with a valid server-side key and synthetic image/transcript.
- UI response shape matches the shared route contract.
- Live results are only marked `LIVE_META` after successful upstream responses.
- Error paths never masquerade as success.
- Include exact official doc links and date checked in code comments/docs.

If credentials are unavailable, complete fixture path, mocked adapter tests and configuration validation; clearly report that live smoke tests were not run.

---

## Agent C — Domain, synthetic scenarios and workflow

**Branch:** `agent/domain-data`

Own the domain layer and deterministic synthetic dataset. Read `ARCHITECTURE.md`, `docs/DEMO_DATA.md`, `docs/TEST_PLAN.md`, and `AGENT_WORKSTREAMS.md`.

Ownership: `src/lib/contracts.ts`, `src/lib/domain/**`, `src/lib/workflow/**`, `src/data/**`, `public/demo-assets/**`, `assets/README.md`.

Tasks:
1. Implement Zod schemas and inferred TypeScript types for Scenario, EvidenceRef, Provenance, Issue, WorkOrder, ChecklistItem, WorkOrderEvent, ProviderError.
2. Use exact enum values and camelCase transport fields as specified; document any necessary translation from conceptual snake_case examples in ARCHITECTURE.md.
3. Add three synthetic scenarios from `docs/DEMO_DATA.md`, each with authored transcript, fictional location/asset, alt text, and expected issue fixture.
4. Create synthetic images or authored vector illustrations suitable for redistribution. Document source and license for each.
5. Implement deterministic segmentation and issue extraction fixture outputs with stable IDs and `DEMO_FIXTURE` provenance.
6. Implement work-order creation only after explicit issue confirmation.
7. Implement allowed status transitions, checklist updates, feedback and audit timeline events.
8. Preserve unknowns and evidence refs; prevent model output from overwriting trusted scenario location/asset identifiers.
9. Add schema and workflow tests.

Do not implement Meta API calls, API route handlers, React components, or CI. Do not use random fixture values; deterministic output is required.

Acceptance:
- Schema tests pass.
- Three scenarios load deterministically.
- Assets are synthetic and licensed/documented.
- Work-order state transitions and human confirmation are tested.
- Every fixture response is explicitly `DEMO_FIXTURE`.
- Shared contract/API shapes match `AGENT_WORKSTREAMS.md`.

Important: if the frontend or provider agent needs a contract adjustment, handle it through a small ADR and notify them before changing it.

---

## Agent D — QA, CI and release readiness

**Branch:** `agent/qa-release`

Own CI, cross-workstream acceptance tests, release documentation and test reporting. Read `docs/TEST_PLAN.md`, `docs/SUBMISSION_CHECKLIST.md`, and `AGENT_WORKSTREAMS.md`.

Ownership: `.github/workflows/**`, `tests/**`, QA/release docs, CI scripts/config only after coordinating with other agents.

Tasks:
1. Add GitHub Actions for install, lint, typecheck, unit/integration tests and production build.
2. Add end-to-end Playwright test for synthetic scenario → segmentation → extraction → human correction → work-order creation → checklist/status/feedback.
3. Test provenance distinction and ensure fixture mode never appears as live.
4. Test no work order can be created without explicit confirmation.
5. Test malformed API response, provider timeout and missing credentials.
6. Test that secrets are not exposed to client bundles or logs.
7. Verify clean clone setup and exact README commands.
8. Produce `docs/QA_REPORT.md` with commands actually executed, pass/fail, and untested areas.
9. Complete asset/license/security release checklist; do not make repository public.
10. Prepare demo capture checklist based on `DEMO_SCRIPT.md`.

Do not duplicate schemas or rewrite production components/adapters. If the app is not yet merged, write tests against the frozen contracts and coordinate any test harness/config conflict with A/B/C.

Acceptance:
- CI green.
- Clean install/test/build commands documented.
- Core E2E flow passes on fixture mode.
- No fabricated test results.
- Clear release blockers and public-release recommendation.

---

## Integration owner prompt (for me / maintainer)

Act as FixFrame's system architect and integration reviewer. Read all repository specifications and inspect each agent PR. Check ownership boundaries, contract compatibility, security, provenance, synthetic-data disclosure, model API correctness, test evidence, and demo reliability. Reject work that introduces unsupported assumptions, fake live output, hidden fallback, hazardous repair advice, or unnecessary scope. Resolve conflicts through ADRs. Prioritize a polished, reproducible three-minute demo over feature count. Do not claim a prize is assured.
