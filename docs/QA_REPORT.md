# QA Report — Workstream D and integration-owner review

Date: 2026-11-04. This report supersedes the initial branch-state snapshot in PR #7.

## Current repository state

- Workstream C merged in [PR #6](https://github.com/learnermaker/fixframe/pull/6).
- Workstream D merged in [PR #7](https://github.com/learnermaker/fixframe/pull/7).
- Maintainer accepted [ADR 0001](decisions/0001-domain-contract-transport.md) and added [ADR 0002 — BYOK](decisions/0002-byok-meta-api-key.md).
- The repository contains domain contracts, three synthetic scenarios, fixtures, assets, workflow logic and QA harness.
- **The runnable Next.js application and Meta provider routes are not yet present on `main`.** No open PRs were visible at the latest integration review.
- The root `package.json` currently has only `test` and `typecheck` scripts. The CI-required `lint`, `build` and `start` scripts are absent, so CI is not yet expected to pass.

## Evidence actually reported by Workstream C

C's PR reports:
- `npx vitest run`: 107 tests passed across 4 files.
- `npx tsc --noEmit`: clean.
- Synthetic illustrations visually inspected.

These results are agent-reported in PR #6; the integration owner has not independently run them in this environment. Lint, Next.js production build, UI integration, and live Meta calls were not run.

## Evidence actually reported by Workstream D

D's PR reports:
- Test harness TypeScript check passed.
- Seven Playwright tests were discovered/compiled, not executed.
- Acceptance harness: 25/25 passed against a throwaway stub implementing the documented API contract.
- Negative control: hidden fixture fallback caused the live-failure tests to fail as intended.
- Fresh clone of the D branch and test-package install/typecheck/listing passed.
- Root clean-clone install failed because the app package was not present at the time of that test.

These validate the test harness, not the real application. Do not describe the app as E2E-tested.

## Current acceptance matrix

| Area | Current state |
|---|---|
| Canonical Zod contracts and domain workflow | Merged; agent-reported unit tests |
| Synthetic scenario fixtures and image/mask assets | Merged; source documented in `assets/README.md` |
| Human confirmation gate | Implemented in domain reducer; needs UI E2E verification |
| Frontend workspace | Not yet merged |
| SAM 3.1 / Muse Spark routes | Not yet merged or live-tested |
| BYOK | Security contract accepted in ADR 0002; implementation pending |
| CI against app | Not yet possible; required root scripts/app are absent |
| Playwright E2E against app | Written, not executed |
| Secret non-disclosure | Harness tests exist; real app/bundle verification pending |
| Accessibility/mobile checks | Not automated yet |
| Public-release licence and notices | Pending maintainer decision and review |

## Required next verification

1. Merge frontend and provider PRs only after contract/security review.
2. Add root scripts `lint`, `typecheck`, `test`, `build`, and `start`; ensure the lockfile matches.
3. Run clean-clone install, lint, typecheck, unit tests, production build, acceptance tests and Playwright E2E against the real app.
4. Test fixture mode with no keys; test live-mode missing-key errors; test BYOK precedence and no-fallback behaviour using mocked upstreams.
5. If valid credentials are available, run live SAM and Muse smoke tests against the synthetic assets and record exact results. If unavailable, state this plainly and do not claim live integration verified.
6. Verify no key in browser bundles, HTML, responses, logs, URLs, storage, screenshots or git history. Run a dedicated history secret scanner after all agent commits.
7. Confirm asset/code licensing, add `LICENSE` and third-party notices, then re-evaluate public visibility.

## Known limitations

- C's unsafe-claim filter is phrase-based, not a safety classifier.
- Completion currently does not require all checklist items to be checked.
- Fixture bounding boxes are not automatically tested against the masks.
- The synthetic images are authored illustrations, not photographs; live model quality on them is unverified.
- In-memory workflow state does not persist across refreshes.
