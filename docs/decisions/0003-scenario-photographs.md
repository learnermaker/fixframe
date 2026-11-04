# ADR 0003 — Real photographs in scenarios

Status: **accepted by maintainer** on 2026-11-04.

## Context

The demo now uses real third-party photographs. They are JPEGs of varying size, and some licences require visible credit. The contract only allowed PNGs, and code assumed one image size.

## Decision

`Scenario.image` changes as follows. Every field is required unless noted.

| Field | Change |
|---|---|
| `path` | PNG or JPEG under `/demo-assets/`, including subfolders |
| `width`, `height` | Added. The image's pixel size |
| `credit` | Added and optional: `{ text, url }`. Shown with the image |

`Scenario.synthetic` stays `true`. It describes the scenario record (site, asset and transcript), which remains authored, not the photograph.

Segmentation boxes and masks stay in the pixel coordinates of the scenario's image.

## Consequences

- Live SAM and Muse Spark receive the committed image with its real type, and SAM's reported frame size must match the declared size.
- Any scenario using a photograph must carry the credit its licence needs.
- By a separate maintainer decision, the app UI no longer states that content is synthetic. `docs/DEMO_DATA.md` and the README still do, and submission materials should too.
