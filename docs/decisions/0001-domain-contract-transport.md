# ADR 0001 — Domain contract transport shape

Status: **accepted by maintainer** on 2026-11-04.

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
| `Issue.confidence` | Optional, and only `null` is valid. | No calibrated score exists. |
| `Issue` arrays | The schema permits empty `evidence`, `unknowns`, `provenance`, as in the API example. `issueFromModelOutput` requires non-empty `evidence` and `unknowns` for model output. | Keeps documented transport valid while holding model output to evidence rules. |
| `WorkOrder.status` | `open`, `in_progress`, `blocked`, `completed`. | Only `open` was shown. It maps to the issue status of the same name, with `open` mapping to `work_order_created`. |
| Status graph | `open → in_progress, blocked`; `in_progress → blocked, completed`; `blocked → in_progress`; `completed` is terminal. | Explicit workflow transition policy. |
| `mask.format` | `alpha-png-data-url` or `public-path`. | Fixtures use `public-path`; live adapter may use a data URL. |
| `boxes[]` | `{ x, y, width, height }` in image pixels, top-left origin, within image bounds. | Defines coordinate semantics. |
| `Scenario.image.path` | PNG under `/demo-assets/`. | Keeps image/mask alignment for authored illustrations. |
| `Scenario.segmentationPrompt` | Added. | Frontend needs a prompt for `POST /api/segment`. |
| Transcript evidence ref | `transcriptRef(scenarioId)`, e.g. `transcript-water-ingress-01`. Image-region refs use segmentation `id`. | Stable refs without extra scenario fields. |
| `Feedback` | `{ id, author, message, createdAt }`. | Defines feedback records. |
| `WorkOrderEvent` | `{ id, type, issueId, workOrderId, actor, message, createdAt, changes? }`. `workOrderId` is null for review events before order creation. | Defines an auditable workflow history. |

## Implementation guidance

- **Frontend:** import canonical types from `src/lib/contracts.ts`; use `startWorkflow` and `applyWorkflowAction` from `src/lib/workflow/workOrderWorkflow.ts`.
- **Providers:** serve fixtures with `getFixtureSegmentation` and `getFixtureIssue` from `src/data/fixtures.ts`. Pass live Muse output through `issueFromModelOutput`; model output must not set trusted location or asset identifiers.
- **QA:** test against these canonical schemas; do not duplicate schemas in the test harness.

## Maintainer review notes

Accepted for the hackathon implementation. The decisions are internally consistent with the current canonical Zod schemas and the API contract. This acceptance does **not** certify model correctness or remove the need for integration tests. The completion/checklist policy remains as implemented: work orders can currently be completed with unchecked items. Treat that as an explicit product limitation, not as proof that work is complete in a real facility.
