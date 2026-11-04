# Release readiness — status as of 2026-11-04

Source of truth: `docs/SUBMISSION_CHECKLIST.md`, `docs/TEST_PLAN.md`, and the current [QA report](QA_REPORT.md). The repository remains private.

## Recommendation

**Do not make the repository public yet.** Domain contracts, synthetic data, workflow logic and the QA harness are merged, but the runnable application and provider routes are not yet integrated. Build/test evidence against the real app is absent.

## Current blockers

| # | Blocker | Owner |
|---|---|---|
| 1 | Next.js application, API routes and root scripts (`lint`, `typecheck`, `test`, `build`, `start`) not yet integrated; CI cannot pass | Frontend/provider agent + integration owner |
| 2 | README setup instructions still need to match a clean install of the final app | Integration owner after app merge |
| 3 | Core E2E flow written but never executed against the real app; selectors may need adjustment | Frontend, then D |
| 4 | Live SAM 3.1 and Muse Spark calls have not been smoke-tested | Provider agent / maintainer |
| 5 | BYOK security contract accepted; implementation and tests pending | Frontend + provider agent |
| 6 | No `LICENSE`; code/asset licensing and third-party notices need final maintainer review | Integration owner |
| 7 | Dependency licence review for the final application is pending | D |
| 8 | Dedicated full-history secret scan not run after agent code merges | D / integration owner |

## Completed foundation

- Workstream C merged: canonical Zod contracts, three synthetic scenarios, fixtures, authored PNG/SVG assets, evidence checks and workflow reducer.
- Workstream D merged: CI workflow, black-box acceptance harness, Playwright E2E definitions, QA report and demo/release checklists.
- ADR 0001 accepted; ADR 0002 defines session-only BYOK.
- Repository is still private. No public release action has been taken.

## Required release sequence

1. Integrate frontend and Meta provider implementations against the accepted contracts and BYOK ADR.
2. Ensure root package scripts and lockfile support a clean install, lint, typecheck, tests, production build and production start.
3. Run D's acceptance suite and Playwright E2E against the real application; update QA report with actual results.
4. Run live SAM and Muse smoke tests with synthetic inputs when credentials are available. Never represent mocked tests as live verification.
5. Verify BYOK precedence, missing-key handling, no-fallback semantics and secret non-disclosure.
6. Choose a source licence, confirm asset licence, add `LICENSE` and third-party notices.
7. Run a dedicated secret scanner across full git history after all code merges; rotate any exposed credential.
8. Verify README, demo recording, and submission description; only then make the repo public and verify logged-out access.

Hackathon submission rules, track selection, video accessibility, and deadline confirmation remain maintainer responsibilities.
