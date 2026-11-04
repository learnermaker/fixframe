# ADR 0001 — Domain contract transport shape

Status: proposed by Workstream C; awaiting integration-owner review.

`src/lib/contracts.ts` is the first implementation of the conceptual schemas in `ARCHITECTURE.md`. This records where it translates or fills gaps in those documents. No enum listed in `ARCHITECTURE.md` was changed.

## snake_case to camelCase

`ARCHITECTURE.md` examples are conceptual. Transport fields are camelCase, as in the `AGENT_WORKSTREAMS.md` API examples, and strict schemas reject the snake_case spellings.

| Conceptual | Transport |
|---|---|
| `asset_label` | `assetLabel` |
| `expected_issue_id` | `expectedIssueId` |
| `scenario_id` | `scenarioId` |
| `issue_id` | `issueId` |
| `acceptance_criteria` | `acceptanceCriteria` |
| `request_id` | `requestId` |
| `created_at` | `createdAt` |
| `fixture_id` | `fixtureId` |

## Gaps the documents left open

| Topic | Decision | Why |
|---|---|---|
| `Provenance.requestId`, `fixtureId` | Optional and nullable. | The API example omits `requestId`; `ARCHITECTURE.md` shows both as null. |
| `Provenance` rules | `DEMO_FIXTURE` requires `fixtureId`; other sources must not have one. `USER_EDIT` has `model: null` and `operation: "user_edit"`. | Fixture and live output must not be confusable. |
| `Provenance.operation` | `segmentation`, `extraction`, `transcription`, `user_edit`. | Only `segmentation` was shown. |
| `Issue.confidence` | Optional, and only `null` is valid. | The API example omits it, `ARCHITECTURE.md` shows null, and numeric scores are prohibited. |
| `Issue` arrays | The schema permits empty `evidence`, `unknowns`, `provenance`, as in the API example. `issueFromModelOutput` requires non-empty `evidence` and `unknowns` for model output. | Keeps the documented transport valid while holding model output to the evidence rules. |
| `WorkOrder.status` | `open`, `in_progress`, `blocked`, `completed`. | Only `open` was shown. It maps to the issue status of the same name, with `open` mapping to `work_order_created`. |
| Status graph | `open → in_progress, blocked`; `in_progress → blocked, completed`; `blocked → in_progress`; `completed` is terminal. | No graph was specified. Completion does not require a finished checklist. |
| `mask.format` | `alpha-png-data-url` or `public-path`. | The example value `alpha-png-data-url-or-public-path` reads as a description of two options. Fixtures use `public-path`; a live adapter would use the data URL. |
| `boxes[]` | `{ x, y, width, height }` in image pixels, top-left origin, within image bounds. | The example array was empty. |
| `Scenario.image.path` | PNG under `/demo-assets/`. | `ARCHITECTURE.md` shows a JPEG. PNG is lossless for flat illustrations, and the mask overlay stays aligned. |
| `Scenario.segmentationPrompt` | Added. | The frontend needs a prompt to send to `POST /api/segment`. |
| Transcript evidence ref | `transcriptRef(scenarioId)`, giving `transcript-water-ingress-01`. | `ARCHITECTURE.md` shows `transcript-001`, but a derived ref needs no extra scenario field. Image-region refs are the segmentation `id`. |
| `Feedback` | `{ id, author, message, createdAt }`. | `feedback` was shown only as an empty array. |
| `WorkOrderEvent` | `{ id, type, issueId, workOrderId, actor, message, createdAt, changes? }`. `workOrderId` is null for review events before the order exists. | The shape was unspecified, and edits must create audit events. |

## How other workstreams use this

- **A (frontend):** import types from `src/lib/contracts.ts`; drive state with `startWorkflow` and `applyWorkflowAction` from `src/lib/workflow/workOrderWorkflow.ts`. The reducer returns `{ ok: false, code, message }` rather than throwing, and takes `actor` and `at` from the caller.
- **B (providers):** serve fixtures with `getFixtureSegmentation` and `getFixtureIssue` from `src/data/fixtures.ts`. Pass live Muse output through `issueFromModelOutput` in `src/lib/domain/modelIssue.ts`, which enforces trusted location and asset identifiers, evidence resolution and claim checks. Model prompts should cite `transcriptRef(scenario.id)` and the segmentation `id` as evidence refs.
- **D (QA):** `package.json` and `tsconfig.json` are a minimal bootstrap because no workstream owned them and tests could not run without them. A and D will extend them; no Vitest config was added and imports are relative, so none is needed yet.
