# Hackathon Submission and Public Release Checklist

## Product
- [ ] One repeatable end-to-end scenario works from selection through feedback.
- [ ] First 15 seconds clearly communicate problem and product.
- [ ] Live Meta output is visible for each integration claimed as live.
- [ ] Fixture mode is honest, labelled, independently usable.
- [ ] Synthetic and third-party-photo status disclosed accurately in README, video and submission (the app UI no longer states it, by maintainer decision on 2026-11-04; see ADR 0003 and docs/DEMO_DATA.md).

## Technical
- [ ] Fresh install/build/test passes.
- [ ] Environment variables documented in `.env.example`.
- [ ] No keys in source, frontend bundle, logs, screenshots, or git history.
- [ ] Model IDs/endpoints/payloads match current official Meta docs.
- [ ] Timeouts, rate limits, malformed responses, empty masks handled.
- [ ] CI green.
- [ ] No runtime dependency on private Appdraft source.

## Open source
- [ ] Choose a license compatible with source and assets.
- [ ] Add LICENSE.
- [ ] Add third-party notices if required.
- [ ] Verify all assets were created for repository or are redistributable.
- [ ] Remove private data/secrets from entire git history.
- [ ] Make repository public only after final review.

## Demo
- [ ] Three minutes maximum; verify exact hackathon upload rules.
- [ ] Actual app walkthrough; no fake model calls.
- [ ] Demo narration is accurate about which content is authored and which photos are third-party.
- [ ] Show SAM segmentation, Muse Spark extraction, human correction, work-order lifecycle.
- [ ] Readable browser capture and audible narration.
- [ ] Video link accessible to judges.

## Submission
- [ ] Indie Developer track selected.
- [ ] Public GitHub URL verified logged out/incognito.
- [ ] README understandable without context.
- [ ] Demo video link opens.
- [ ] Description accurately reflects implementation.
- [ ] Submit before deadline; retain confirmation.
