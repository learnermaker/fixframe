# Synthetic Demo Data Policy

## Policy

Every site, asset, technician, maintenance report, customer and incident in the FixFrame demo is fictional. Most scenarios use real third-party photographs, recorded in `assets/demo-evidence/README.md`, as visual inputs only: they are not evidence of a FixFrame site or incident. Demo assets and records must be labelled in documentation. By maintainer decision on 2026-11-04, the app UI does not state that content is synthetic or fictional; provenance labels (`DEMO_FIXTURE`, `LIVE_META`, `USER_EDIT`) stay.

Never describe synthetic content as customer-provided, field-tested, operationally validated, or sourced from actual maintenance activity.

## Scenario A — Ceiling tile discolouration
- ID: `water-ingress-01`
- Fictional site: Demo Building A
- Fictional area: Level 2 / North corridor
- Fictional asset label: CEILING-ZONE-N2
- Visible observation: discoloured patch on a ceiling tile.
- Synthetic transcript: “I noticed a discoloured patch on the ceiling tile near the north corridor. I don't know what caused it.”
- Unknowns: source, hidden extent, whether moisture is present, safety status.
- Safe work-order scope: review evidence, confirm location, record qualified follow-up decision.
- Disallowed: root-cause claims, leak diagnosis, structural certification, repair instructions.

## Scenario B — Cable sheath mark on isolated training prop
- ID: `cable-sheath-02`
- Fictional site: Demo Workshop B
- Fictional area: Training bench 04
- Fictional asset label: TRAINING-CABLE-04
- Visible observation: outer sheath has a visible mark in a staged image.
- Synthetic transcript: “There is a visible mark on the cable covering at the training bench. This is a disconnected display prop.”
- Unknowns: real-world electrical state, internal conductor condition, suitability for use.
- Safe work-order scope: flag the training prop for instructor review; keep it out of use in the simulated scenario.
- Disallowed: live electrical diagnosis, repair instructions, declaring real equipment safe.

## Scenario C — Handrail bracket on mock training fixture
- ID: `handrail-bracket-03`
- Fictional site: Demo Training Facility
- Fictional area: Mock stairwell rig
- Fictional asset label: RAIL-FIXTURE-03
- Visible observation: bracket/fastener appears displaced in staged image.
- Synthetic transcript: “The bracket on the mock handrail fixture looks out of alignment. Please review the training rig.”
- Unknowns: load capacity, structural condition, suitability outside the demo.
- Safe work-order scope: mark mock rig for instructor inspection.
- Disallowed: structural safety certification or repair instructions.

## Scenario D — Pipe joint corrosion
- ID: `pipework-corrosion-04`
- Fictional site: Demo Plant C
- Fictional area: Plant room 2
- Fictional asset label: PIPE-JOINT-04
- Image: third-party photograph.
- Authored transcript: “There is visible corrosion around this pipe joint. Please have the maintenance team inspect it.”
- Unknowns: source, condition inside the pipe, extent, safety status.
- Disallowed: root-cause claims, safety certification, repair instructions.

## Scenario E — Concrete deterioration
- ID: `concrete-spalling-05`
- Fictional site: Demo Structure D
- Fictional area: Support column 5
- Fictional asset label: CONCRETE-COLUMN-05
- Image: third-party photograph.
- Authored transcript: “There is visible deterioration on this concrete surface. Please arrange an inspection.”
- Unknowns: source, depth, structural condition, safety status.
- Disallowed: structural certification, root-cause claims, repair instructions.

## Asset requirements

Each image must be generated for this demo, created by the project, or licensed for redistribution. Record source and license in `assets/README.md`. Avoid real people, identifiable private locations, company logos, or identifying data. Include descriptive alt text and synthetic metadata.

Do not commit assets downloaded from random URLs without recording license/source. If assets are not ready, use authored SVG illustrations or local diagrams as temporary placeholders and label them accordingly.

## Transcripts and golden outputs

Transcripts are authored synthetic text, not recordings of real people; call them “demo transcript” or “synthetic transcript”. Expected issue records are test fixtures, not ground-truth annotations for real facilities. Distinguish them from live model output in the UI.
