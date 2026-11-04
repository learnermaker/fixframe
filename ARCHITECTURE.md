# FixFrame — Architecture and Contracts

## 1. Principle

Build a small, single-user demo application with replaceable providers. Separate workflow logic from Meta adapters and deterministic fixtures. The same user journey must work without external API credentials, while model provenance remains unambiguous.

## 2. Logical components

```text
Synthetic Scenario Gallery
        |
        v
Evidence Workspace ---- Source Image + Scenario Transcript
        |                         |
        |                         v
        |                  Muse Spark Adapter
        |                         |
        v                         v
SAM 3.1 Adapter             Structured Issue
        |                         |
        v                         v
Segmentation Overlay ---- Human Review / Edit
                                  |
                                  v
                            Work Order
                                  |
                    Checklist / Status / Feedback
                                  |
                                  v
                            Audit Timeline
```

### Frontend
- Scenario gallery and workspace.
- Image viewer with segmentation overlay.
- Transcript panel.
- Extraction result and evidence links.
- Human review form.
- Work-order detail, checklist, status, feedback, timeline.
- Explicit provenance labels: `LIVE_META`, `DEMO_FIXTURE`, `USER_EDIT`.

### Backend
- Scenario catalog and asset delivery.
- Provider orchestration.
- Input/output validation.
- Safety/unsupported-claim filtering.
- Work-order transitions and persistence.
- Audit/provenance events.

### Model adapters
- `SegmentationProvider.segment(image, prompt, scenario)`
- `IssueExtractionProvider.extract(image, transcript, scenarioContext)`
- `TranscriptionProvider.transcribe(audio)` (optional)
- Fixture implementations of the same interfaces.

Keep secrets on server. Never expose Meta tokens in browser code, static assets, logs, or checked-in environment files.

## 3. Canonical data contracts

Implement language-native types matching these conceptual schemas and validate strictly at every boundary.

### Scenario
```json
{
  "id": "water-ingress-01",
  "title": "Ceiling tile moisture mark",
  "synthetic": true,
  "site": "Demo Building A",
  "area": "Level 2 / North corridor",
  "asset_label": "CEILING-ZONE-N2",
  "image": {
    "path": "/demo-assets/ceiling-moisture.jpg",
    "alt": "Synthetic training image of a ceiling tile with a visible discoloured patch"
  },
  "transcript": "Demo transcript: I noticed a discoloured patch on the ceiling tile near the north corridor...",
  "expected_issue_id": "issue-demo-001"
}
```

### Provenance
```json
{
  "source": "LIVE_META",
  "provider": "meta",
  "model": "verified-model-id",
  "operation": "segmentation",
  "request_id": "provider-request-id-or-null",
  "created_at": "ISO-8601",
  "fixture_id": null
}
```
Allowed `source`: `LIVE_META`, `DEMO_FIXTURE`, `USER_EDIT`.

### Issue
```json
{
  "id": "issue-demo-001",
  "scenario_id": "water-ingress-01",
  "title": "Discoloured ceiling tile observed",
  "description": "A discoloured patch is visible on the ceiling tile. The source and cause are unknown.",
  "location": "Level 2 / North corridor",
  "asset_label": "CEILING-ZONE-N2",
  "category": "building_fabric",
  "urgency": "review",
  "status": "needs_review",
  "confidence": null,
  "evidence": [
    {"kind": "image_region", "ref": "segmentation-001", "supports": "visible discolouration"},
    {"kind": "transcript", "ref": "transcript-001", "supports": "reported location"}
  ],
  "unknowns": ["source of moisture", "extent behind the visible surface", "safety status"],
  "provenance": []
}
```

Controlled enums:
- category: `building_fabric`, `plumbing_observation`, `electrical_visual_observation`, `accessibility_fixture`, `other`.
- urgency: `routine`, `review`, `priority_review`. These are workflow labels, not safety ratings.
- status: `needs_review`, `confirmed`, `work_order_created`, `in_progress`, `blocked`, `completed`.

Do not use numeric confidence unless provider returns a calibrated/meaningful score and its interpretation is documented. Prefer explicit unknowns.

### Work order
```json
{
  "id": "WO-DEMO-001",
  "issue_id": "issue-demo-001",
  "title": "Review reported ceiling tile discolouration",
  "summary": "Review the observation and determine whether a qualified inspection is needed.",
  "owner": "Demo Facilities Team",
  "status": "open",
  "checklist": [
    {"id": "check-1", "label": "Confirm the reported corridor location", "done": false},
    {"id": "check-2", "label": "Review the source photo and note", "done": false},
    {"id": "check-3", "label": "Record a qualified follow-up decision", "done": false}
  ],
  "acceptance_criteria": [
    "Observation and unknowns have been reviewed",
    "Follow-up decision is recorded by a human reviewer"
  ],
  "feedback": [],
  "events": []
}
```

Checklist entries are administrative/review tasks, not step-by-step repair instructions.

## 4. Evidence rules

- Each extracted factual claim should reference an input source or be marked as an inference requiring confirmation.
- Location and asset identifiers come from scenario catalog or confirmed user input, not visual inference.
- Distinguish visible observation from cause, risk, and recommended action.
- Original evidence is immutable; edits create audit events.
- Segmentation is a region-selection aid, not proof of defect.
- Empty masks, malformed coordinates, or low-quality results produce explicit error/empty states.

## 5. Provider orchestration

1. Load scenario metadata and local demo image.
2. Run SAM segmentation.
3. Run Muse Spark extraction using only documented supported modalities.
4. Validate response against Issue schema.
5. Apply safety constraints and preserve unknowns.
6. Present result for human correction.
7. On explicit confirmation, create work order from safe templates.
8. Store event and provenance metadata.

### Error semantics
- `UNCONFIGURED`: provider credentials absent.
- `TIMEOUT`: provider did not respond within budget.
- `RATE_LIMITED`: provider throttled request.
- `UPSTREAM_ERROR`: provider error.
- `INVALID_RESPONSE`: response failed schema validation.
- `UNSUPPORTED_INPUT`: unsupported media/format.
- `SAFETY_REVIEW_REQUIRED`: output contains disallowed or unconfirmed claims.

Never silently switch to fixture mode after live failure. User may deliberately select fixture provider.

## 6. Security and privacy

- Store API keys only in server-side environment variables.
- Commit `.env.example`; ignore `.env`, credentials, logs, generated artifacts.
- Limit image MIME types and payload sizes.
- Do not accept arbitrary remote image URLs.
- Avoid arbitrary code generation/execution.
- No accounts or sensitive personal data needed.
- Commit assets only when their licenses/provenance permit redistribution.

## 7. Appdraft relationship

Appdraft is a separate toolkit in `learnermaker/appdraft`. It can inform safe-preview and share/feedback design, but FixFrame must independently build from this repository. Do not import a private package, depend on a private Git URL, or imply Appdraft is integrated unless that integration is implemented and reproducible.
