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

## QA revalidation — Workstream D (branch `agent/qa-revalidation`, based on `main` @ `118be48`)

**Still no frontend or provider implementation on `main`.** `agent/frontend` and `agent/meta-providers` still point at `c41d3c9`; there are no open PRs. So the post-integration checks requested in the follow-up brief **could not be run**, and no E2E success is claimed.

### Commands actually executed

From a fresh `git clone` of the pushed branch (`76905e8`, Node 24.21.0 / npm 11.19.0, Windows 11):

| Command | Result |
|---|---|
| `npm ci` | PASS |
| `npm run lint` | **FAIL** — `Missing script: "lint"` |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 4 files, 107 tests (independently reproduces C's reported count) |
| `npm run build` | **FAIL** — `Missing script: "build"` |
| `npm ci --prefix tests` | PASS |
| `npm run typecheck --prefix tests` | PASS (tests import C's canonical schemas and scenario catalog) |
| `npm run acceptance --prefix tests` | **FAIL, expected** — "app exited before becoming ready" (no `start` script / app) |
| `npm run e2e:list --prefix tests` | PASS — 28 tests in 4 files listed (14 per project x desktop and mobile 375x812); **listing only, not executed** |
| Playwright browser install, `npm run e2e --prefix tests` | **Not run** — no app |

Additional runs (not clean-clone):
- Acceptance suite against a **throwaway stub** (scratchpad, not committed) that serves C's real fixtures and implements my reading of the API contract and ADR 0002: **42/42 passed**. This validates the harness and C's fixtures against the canonical response schemas; it says **nothing** about B's providers or A's UI.
- Negative controls on that stub: BYOK/deployment precedence reversed -> 4 BYOK tests failed; error message echoing the key -> 6 BYOK tests failed; earlier, silent fixture fallback in live mode -> 12/12 live-failure tests failed.
- Licence read from `package.json` of every installed package (root and `tests/`): MIT, Apache-2.0, ISC, BSD-3-Clause, plus 2 MPL-2.0 (`lightningcss` and its platform binary, a dev-only Vite tooling dependency). Production dependency of the app: `zod` 4.6.7 only. No third-party notices file yet.
- Dedicated secret scanner: **not run** — none installed (gitleaks/trufflehog/docker absent). A `secret-scan` job (gitleaks action, full history) was added to `.github/workflows/ci.yml`; its first result is unverified. The earlier regex-only history scan is not a substitute.

### What changed in the tests
- Fixture-mode responses are now validated with `SegmentResponseSchema` / `ExtractResponseSchema` (imported from `src/lib/contracts.ts`, not copied); expected location/asset come from `src/data/scenarios.ts`. Previously-guessed scenario locations were consistent with the catalog (no mismatch found).
- New `tests/acceptance/byok.acceptance.ts` (ADR 0002): no key -> `UNCONFIGURED`; BYOK only -> forwarded upstream; deployment only; both -> BYOK for that request only, then deployment key; blank header ignored; rejected BYOK -> error, no deployment-key retry, no fixtures, no leak; fixture mode ignores both; key absent from responses, logs, upstream URLs and later-served HTML.
- Secrets test now checks both the deployment sentinel and a BYOK sentinel.
- New `tests/e2e/byok.e2e.ts`: masked input; header-only transmission to same-origin routes; Clear removes it from later requests; refresh clears it; no storage/cookies/URL/DOM/error-message exposure.
- New `tests/e2e/responsive-keyboard.e2e.ts` and a second Playwright project at 375x812: no horizontal overflow, synthetic banner visible, keyboard activation of the narrated path, focus indicator, `role="alert"` errors.

### Frontend label mismatches
Cannot be assessed — there is no frontend. The expected accessible names are centralised in `tests/e2e/ui.ts` and listed in `tests/README.md`; expect a first adjustment round once A's PR exists.

### Acceptance items from the follow-up brief — status

| Item | Status |
|---|---|
| Fixture mode works with no credentials; provenance always `DEMO_FIXTURE` | Test written; **not run on real app** |
| Live + no credentials -> `UNCONFIGURED`; no silent fallback after live failure | Same |
| Human confirmation before work order; issue edits/workflow events in audit timeline | UI tests written, **not run**. Domain reducer covered by C's unit tests (107 pass, reproduced) |
| SAM / Muse responses validated against canonical schemas | Only the fixture and error shapes are checked against canonical schemas. Live-response validation needs B's adapters and the real Meta response shape — **untested** |
| BYOK precedence, rejected key, no fallback, clearing, refresh | Tests written; harness-validated on stub only |
| Key absent from bundles, HTML, responses, logs, URLs, storage, screenshots, errors | Tests written for all but screenshots; **not run on real app**. Screenshots/recordings need a manual review |
| Desktop and narrow mobile; keyboard; accessible errors | Tests written, **not run** |
| Live Meta smoke tests | **Not run** (no credentials, no adapters). Live Meta integration is **not verified** |
| Clean-clone README setup commands | README has no setup commands yet and the app has no `lint`/`build`/`start`: **fails** |

## Known limitations

- C's unsafe-claim filter is phrase-based, not a safety classifier.
- Completion currently does not require all checklist items to be checked.
- Fixture bounding boxes are not automatically tested against the masks.
- The synthetic images are authored illustrations, not photographs; live model quality on them is unverified.
- In-memory workflow state does not persist across refreshes.
