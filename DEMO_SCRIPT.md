# FixFrame — Three-Minute Demo Script

## Narrative

“A maintenance issue rarely arrives as a clean form. It starts as a photo and a quick observation. FixFrame turns that evidence into a work order while keeping a human in control.”

Use one low-risk synthetic scenario. Keep another scenario ready as a brief robustness proof.

## Run of show (180 seconds)

| Time | Screen / action | Narration |
|---|---|---|
| 0:00–0:15 | Open gallery. Select ceiling tile scenario. | “This is a demo scenario: a real photo with fictional site details and an authored transcript.” |
| 0:15–0:35 | Show original photo, fictional site/area and transcript. | “The source evidence stays visible. We do not infer the hidden cause or declare the area safe.” |
| 0:35–1:00 | Run SAM 3.1; overlay returned mask/region. Show provenance. | “SAM identifies a region of interest. This is visual assistance, not a defect diagnosis.” |
| 1:00–1:25 | Run Muse Spark extraction. Show structured issue and unknowns. | “Muse Spark turns the evidence into a structured observation. Unknowns stay explicit.” |
| 1:25–1:50 | Correct location/urgency; show source references and user-edit marker. | “The reviewer remains responsible for the facts and classification.” |
| 1:50–2:25 | Create work order. Complete checklist item; update status; add feedback. | “The confirmed observation becomes a trackable work item with review criteria and an audit trail.” |
| 2:25–2:45 | Show event timeline and provenance. | “We can distinguish model output, fixtures, and human edits.” |
| 2:45–3:00 | Show architecture and limitations. | “FixFrame is a reproducible prototype built entirely on synthetic data. It demonstrates an evidence-to-action workflow, not real-world validation or autonomous maintenance.” |

## Recording rules

- Record the actual running app.
- Do not claim live model output unless the visible call was actually made.
- Never narrate fixture mask as SAM output.
- Do not invent timing, accuracy, ROI, or safety metrics.
- Keep text legible; avoid terminal sequences and prompt engineering.
- Do not show secrets, private account details, or credentials.
- Keep total length under three minutes; rehearse transitions.

## Backup

If Meta API connectivity is unreliable, switch deliberately to `DEMO_FIXTURE` before recording and keep the label visible. Explain limitations accurately. Never narrate fixture output as live inference.
