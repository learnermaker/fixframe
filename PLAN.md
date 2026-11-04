# FixFrame — Build Plan

## 1. Objective

Deliver a reliable, visually compelling, three-minute end-to-end prototype for the Meta Global AI Developer Hackathon. Demonstrate a credible transformation from unstructured visual evidence into a human-reviewed maintenance work order.

The project is entirely synthetic-data-driven. There are no customer interviews, field deployments, real maintenance records, or validated business outcomes. This limitation must be explicit in the UI, README, video narration, and submission text.

## 2. Product definition

**User:** a fictional facilities/maintenance coordinator reviewing an observation from a technician.

**Job to be done:** convert an image plus a short observation into a structured work item without losing the connection to the original evidence.

**Core promise:** Turn a maintenance observation into a reviewable work order—with evidence attached and a person in control.

**Demo differentiator:** a traceable workflow, not a generic chat assistant or form generator:
- original image and selected region,
- transcript and extracted facts,
- evidence/source links for each material claim,
- visible human corrections,
- editable work order,
- completion and feedback trail.

## 3. Judging strategy

Working interpretation of common judging dimensions, not an asserted official scoring formula:
- **Impact:** recognisable operational workflow and clear before/after transformation.
- **Creative Meta AI use:** SAM segmentation plus Muse Spark multimodal interpretation in a coherent sequence.
- **Demo quality:** immediate visual payoff and a complete happy path in under three minutes.
- **Technical execution:** typed contracts, robust error handling, reproducible scenarios, meaningful tests, and honest model provenance.

A working demo is more valuable than a broad unfinished platform. Do not build a full CMMS, asset database, multi-tenant SaaS, user accounts, payments, production hosting, or autonomous repair system.

## 4. Critical path

### P0 — Reproducible baseline
- Choose a single web stack and document exact runtime versions.
- Create a polished, responsive workspace.
- Provide one install command and one run command.
- Add environment validation and deterministic fixture mode.
- Add CI for lint, typecheck, tests, and build.

**Exit gate:** clean clone runs locally with no secrets and opens the demo workspace.

### P0 — Synthetic scenario gallery
Create at least three curated scenarios with synthetic image asset, alt text, fictional site/area/asset identifiers, synthetic transcript, expected issue schema, risk boundary, and explicitly excluded inferences.

Suggested scenarios:
1. Ceiling tile discolouration — visible mark; do not claim source or structural safety.
2. Cable sheath visual mark on a disconnected training prop — never infer live electrical state or advise repair.
3. Handrail bracket on mock training fixture — no structural safety certification.

Use the lowest-risk and clearest visual scenario as the primary demo.

**Exit gate:** scenario selection is repeatable; every asset is labelled synthetic; fixture expectations are deterministic.

### P0 — Segmentation
- Integrate the current officially documented SAM 3.1 capability.
- Render mask/region over original image with legend.
- Keep original image intact; show fallback when segmentation fails.
- Persist provider/model/timestamp/status provenance.
- Never invent segmentation after a live failure. Fixture masks must carry a prominent fixture label.

**Exit gate:** at least one live SAM result rendered in the recording, or fixture output honestly disclosed.

### P0 — Structured interpretation
- Integrate Muse Spark after verifying current official API and schema support.
- Use image and transcript context only as supported by the documented endpoint.
- Request schema-constrained issue output.
- Validate server-side; bound retries.
- Do not invent site, asset identity, cause, safety status, or repair procedure.
- Preserve evidence references and unknowns.

**Exit gate:** successful extraction yields a valid typed issue; failure leaves user able to deliberately use fixture mode.

### P0 — Human review and work order
- User edits title, description, location, category, urgency, and owner.
- Required facts must be confirmed before work order creation.
- Generate a fixed checklist from safe templates; no arbitrary repair directions.
- Support status, checklist, comments, and feedback.
- Preserve change history: before/after, author type, timestamp.

**Exit gate:** user creates, edits, completes, and reviews a work order without losing data.

### P1 — Quality
- Unit tests for schema, provenance, safety rules, transitions.
- Integration tests for fixtures and mocked model responses.
- Live API smoke tests where credentials are available.
- Test timeouts and malformed responses.
- Seeded repeatable demo data; no external services required for baseline demo.

**Exit gate:** documented acceptance suite passes on clean environment; failures are visible and recoverable.

### P1 — Submission
- Finish README and architecture diagram.
- Document setup, configuration, data handling, model use, limitations.
- Record three-minute demo from actual running application.
- Ensure public repo builds independently without private dependencies.
- Remove secrets, personal data, and non-redistributable content.
- Add selected open-source license after rights review.

## 5. Coding-agent work packets

Agents may work in parallel only after shared contracts in ARCHITECTURE.md are accepted. Each packet should land as a small, reviewable change.

### Agent A — App shell and interaction design
Deliver responsive dashboard/workspace, scenario selector, evidence panel, segmentation overlay, issue review, work-order lifecycle, and visible source/provenance indicators.

Acceptance:
- usable at desktop/laptop sizes,
- clear first-15-second story,
- complete fixture happy path,
- keyboard-operable controls and focus states.

### Agent B — AI/model integration
Deliver typed provider interfaces, SAM adapter, Muse Spark extraction adapter, timeout/error mapping, provenance, and fixture provider behind same interfaces.

Must verify current official API documentation and model IDs. Keep keys server-side. Never fake live results.

Acceptance:
- no API key in frontend bundle,
- request/response schemas tested,
- graceful unconfigured/timeout states,
- real call tested for each integration when credentials are supplied.

### Agent C — Data and workflow
Deliver canonical entities, in-memory/lightweight persistence, work-order transitions, checklist operations, audit events, and optional share/feedback loop.

Acceptance:
- transitions tested,
- required fields enforced,
- user changes traceable,
- deterministic reset.

### Agent D — QA, demo and release
Deliver automated tests/CI, reproducible scripts, asset rights notes, demo script, release checklist.

Acceptance:
- clean clone validated,
- no tracked secrets,
- fixtures clearly marked,
- video claims match actual implementation.

## 6. Execution order

1. Demonstrate end-to-end fixture flow.
2. Prove Meta API connectivity and schema compatibility.
3. Wire one live segmentation and one live interpretation path.
4. Polish evidence → correction → work-order interaction.
5. Verify repeatability and failure behavior.
6. Record demo and prepare public release.
7. Submit early and check all links/video.

Do not spend critical hours on speculative features or broad platform architecture.

## 7. Explicit non-goals

- Real maintenance advice or repair procedures.
- Safety certification, diagnosis, root cause, or risk clearance.
- Autonomous work execution.
- Full CMMS functionality.
- Customer validation or ROI claims.
- Mandatory audio capture; prerecorded transcript is acceptable.
- Mandatory Appdraft runtime dependency.
- Hidden fixture-to-live substitution.

## 8. Definition of done

- clean clone starts with documented commands,
- synthetic data is labelled throughout,
- one end-to-end scenario demonstrated reliably,
- model usage authentic and disclosed,
- errors never masquerade as success,
- user edits and work-order lifecycle work,
- tests and build pass,
- repository public, licensed, and secret-free,
- three-minute video accessible and matches code.
