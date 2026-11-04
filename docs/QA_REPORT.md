# QA Report — Workstream D

Date: 2026-11-04. Replaces all earlier versions of this report. "Verified" means I ran it myself; "agent-reported" means another agent said so and I did not reproduce it.

**Tested state:** `main` @ `30f3340` (includes frontend, providers, provider hardening, real-photo scenarios per ADR 0003, licence PR #15) plus the QA changes in the PR that adds this report (tests, CI, docs only; no application code). GitHub CI on that PR is the final gate.

Local environment: Windows 11, Node 24.21.0, npm 11.19.0, Playwright Chromium. CI: `ubuntu-latest`, Node 24.

## Results on the tested state (local, production build)

| Step | Result |
|---|---|
| `npm run lint` | PASS (19 s) |
| `npm run typecheck`, `npm test` | PASS, **210 unit tests**, 6 files (30 s) |
| `npm run build` | PASS (19 s) |
| `npm run typecheck --prefix tests` | PASS |
| `npm run acceptance --prefix tests` (`META_API_TIMEOUT_MS=2000`) | PASS, **66 tests**, 6 files (153 s) |
| `npm run e2e --prefix tests` | PASS, **38 tests** (desktop 1280x800, mobile 375x812, live-mode-against-a-mock) (175 s) |
| Manual live smoke test (`npm run live-smoke --prefix tests`), run 2026-11-04 on this build | PASS, 4 of 4 (39 s) |

Not repeated on this exact state: a from-scratch `npm ci` (dependencies are unchanged apart from a `license` field), and the default 60 s upstream timeout path (CI and tests use 1-2 s). An earlier clean-clone run on `724aa04` (before the photo change) passed `npm ci` (462 s), lint, typecheck, 191 unit tests, build, 60 acceptance tests and Playwright; GitHub CI on that commit was green.

## Live Meta smoke test (real calls)

Maintainer-supplied key, passed only as the BYOK header via an environment variable, no deployment key. Runs on 2026-11-04: once on the pre-photo build (`fd650d3`) and once on the tested state above, which uses the real JPEG photo for `water-ingress-01`. Each run, 4/4 passed: SAM 3.1 returned a canonical `LIVE_META` segmentation with at least one box (passing the frame-size check); Muse Spark 1.3 returned a canonical `LIVE_META` issue, `needs_review`, catalog location and asset kept; a deliberately bad key was rejected by the real Meta API as `UPSTREAM_ERROR` with no fixture fallback; the key appeared in no response and no server log.

**Limits:** scenario `water-ingress-01` only, one call each, one day. Box counts, latency and request IDs were not captured. It says nothing about accuracy, safety or the other four scenarios. Live runs on other scenarios, and the live screenshots in `docs/screenshots`, are agent-reported. The key was shared in a chat and must be rotated.

## CI (GitHub Actions)

Three parallel jobs: `secret-scan`, `static` (lint, typecheck, unit tests), `app` (build, acceptance, Playwright). On `724aa04`: secret-scan 7 s, static 68 s, app 3 m 15 s (Playwright 34 passed in 31 s on Linux). npm and the Playwright browser are cached; all actions run on Node 24. The CI acceptance step sets `META_API_TIMEOUT_MS=2000`.

**Secret scan:** gitleaks v8.30.1 CLI, binary pinned and checksum-verified, `fetch-depth: 0`, all refs. On `724aa04`: 39 commits reachable, 33 scanned, **no leaks found**. The fake `FF_SENTINEL_*` test keys are allowlisted by value in `.gitleaks.toml` (not by path). Earlier attempts with `gitleaks-action@v2` failed on permissions and only scan PR commits.

## Requirement matrix

| Requirement | Status |
|---|---|
| Install, lint, typecheck, unit, build, server starts | PASS |
| Fixture mode without credentials; provenance always `DEMO_FIXTURE` (all 5 scenarios, canonical schemas) | PASS |
| Live mode without credentials -> `UNCONFIGURED`; unset mode is live | PASS |
| Live errors never become fixture output; statuses and codes (503/504/429/502/400/422) | PASS (mock upstream) |
| Content-type gate; Meta 400/413/408/504 mapping; unsafe evidence rejected; timeout setting | PASS (mock upstream) |
| BYOK precedence, request-scoped, rejected key never retried with deployment key, fixture ignores keys | PASS (mock upstream, browser, and a real bad-key call) |
| No key in bundles, HTML, responses, logs, URLs, storage, errors | PASS. Screenshots: 3 of 8 inspected earlier, none showed a key |
| Clear and refresh remove the session key | PASS |
| Full fixture flow; human confirmation mandatory; audit timeline; provenance chips | PASS |
| Error and retry states | PASS |
| Desktop and 375x812 width, no horizontal overflow | PASS (Chromium viewport emulation, not a real phone) |
| Keyboard path to review, focus indicator, `role="alert"` | PASS for that path only; not a full keyboard/WCAG audit |
| Mask/image/box consistency for all 5 scenarios (JPEG and PNG) | PASS |
| Live Meta | PARTIAL: one scenario (above) |
| Full-history secret scan | PASS (above) |

## Defects and risks

No critical or high-severity issue found. Open:

1. Extract is enabled before segmentation (fixture issues cite image-region evidence). Medium, UI.
2. Evidence rows are keyed by `ref`, which transcript evidence shares, so rows can collide. Medium, UI.
3. A session key with non-Latin-1 characters makes `fetch` throw and the UI says the server could not be reached. Low, UI.
4. A failed re-segmentation leaves the old overlay and provenance on screen. Medium, UI, matters for demos.
5. Work orders can be completed with unchecked checklist items (documented product limitation). Low.
6. The unsafe-claim filter is phrase matching, not a safety classifier.

These were passed to the UI owner; I did not change application code.

## Not tested

Firefox, WebKit, real mobile devices, screen readers, an axe/WCAG audit; live behaviour on four of five scenarios; invalid `META_API_TIMEOUT_MS` values; persistence across refresh (state is in memory by design); Windows in CI; offline builds (fonts come from Google Fonts at build time). The UI no longer states that content is synthetic (maintainer decision, ADR 0003), so no test asserts it; the README and submission copy carry that disclosure.
