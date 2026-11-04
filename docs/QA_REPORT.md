# QA Report — Workstream D

Branch `agent/qa-release`, based on `main` @ `c41d3c9`. Date: 2026-11-04. Host: Windows 11, Node 24.21.0, npm 11.19.0.

## Headline

**The FixFrame application does not exist on `main` or on any pushed agent branch yet** (all four branches pointed at `c41d3c9`, docs only, when checked after `git fetch`). Therefore:

- **No test in this report has been run against the real app.** The app-facing suites are written against the frozen contract in `AGENT_WORKSTREAMS.md` and are unverified against A/B/C code.
- **CI on this PR will be red** until the root `package.json` with `lint`, `typecheck`, `test`, `build`, `start` scripts and the app land. That is intentional; the workflow has no "skip if empty" guard that would fake a green.
- No live Meta call was made; no credentials were available or used.

## Commands actually executed

| # | Command (where) | Result |
|---|---|---|
| 1 | `git fetch --all --prune`; `git log origin/<branch>` for main, agent/frontend, agent/meta-providers, agent/domain-data, agent/qa-release | All at `c41d3c9` — no app code pushed |
| 2 | `npm install` in `tests/` | OK, 0 vulnerabilities |
| 3 | `npm run typecheck` in `tests/` (tsc, strict) | **PASS** |
| 4 | `npm run e2e:list` in `tests/` | **PASS** — 7 Playwright tests discovered/compiled (listing only, **not executed**) |
| 5 | `npm run acceptance` in `tests/` with `FIXFRAME_START_CMD` pointing at a throwaway stub I wrote (scratchpad, not committed) that implements the documented API contract | 25/25 passed. **This validates the harness only; it says nothing about the real app.** |
| 6 | Negative control: same suite, stub modified to silently fall back to fixture data in live mode | `live-failures`: 12 of 12 tests failed, i.e. the hidden-fallback assertions can fail |
| 7 | History scan: `git log --all -p` piped through a regex for common key/token/private-key patterns | No matches in the 5 existing commits (docs only). Regex scan is not a substitute for gitleaks/trufflehog |
| 8 | Fresh clone of `main`, `npm ci` | **FAIL (expected)**: no `package.json` — README still says setup commands "will be added" |
| 9 | Fresh clone of `agent/qa-release`; `npm ci`, `npm run typecheck`, `npm run e2e:list` inside `tests/` | PASS / PASS / PASS (7 tests listed). Same clone: `npm run acceptance` fails with `app exited before becoming ready ... ENOENT package.json` — loud failure, as designed |
| 10 | `npm view <pkg> license` for the test devDependencies | @playwright/test Apache-2.0, vitest MIT, typescript Apache-2.0, @types/node MIT |

Not run: `npm run lint`, `npm test` (root), `npm run build`, Playwright execution, any browser run, any live-provider call. The root scripts do not exist.

## What the tests cover (and the acceptance matrix)

| ID | Coverage | Status |
|---|---|---|
| A1 clean clone, no keys -> fixture mode | `tests/playwright.config.ts` starts app with explicit `fixture` + empty token | Written, not run on app |
| A2 scenario shows image/transcript/metadata | E2E selects scenario; asset/location asserted via API | Partial; image/transcript content not asserted |
| A3 fixture segmentation + provenance | `fixture-mode.acceptance.ts`, E2E | Written, harness-validated on stub only |
| A4 fixture extraction schema-valid | `fixture-mode.acceptance.ts` asserts documented transport fields only; **no canonical Zod validation** (C's schema module not available, and D must not duplicate schemas) | Partial |
| A5 edit -> `USER_EDIT` | `happy-path.e2e.ts` | Written, not run |
| A6 create work order + gating | `gating-and-errors.e2e.ts`, `happy-path.e2e.ts` | Written, not run. Domain-level gating belongs to C's unit tests |
| A7/A8 checklist, status, feedback, timeline | `happy-path.e2e.ts` | Written, not run |
| A9 timeout -> clear error, no fallback | API: `live-failures` (hang -> `TIMEOUT`); UI: injected `TIMEOUT` | Written; API part harness-validated on stub |
| A10 malformed output rejected, no work order | API: bad shape / non-JSON -> `INVALID_RESPONSE`; UI: 2 malformed variants | Same |
| A11 live badge only after successful call | Negative half only (no `LIVE_META` on any failure). Positive half needs real credentials | **Untested** |
| A12 keyboard navigation | Not automated | **Untested** |
| Secrets in bundle/pages/responses/logs | `secrets.acceptance.ts` (needs build with sentinel token) | Written, harness-validated on stub (the bundle check used a dummy file) |

## Untested / limitations

- Everything against the real app (see headline).
- Live SAM 3.1 / Muse Spark behaviour, coordinate decoding, empty masks, request IDs.
- Whether B's timeout budget is short enough for CI: the `hang` test allows 300 s.
- UI selectors in `tests/e2e/ui.ts` are my guess at A's accessible names; likely to need one round of adjustment.
- Narrow-mobile layout, keyboard-only flow, persistence on refresh, accessibility audit.
- Dependency licence review of the app (no app dependencies exist yet).

## Open requests to other workstreams
See the table in `tests/README.md`. Main ones: root scripts (`lint`, `typecheck`, `test`, `build`, `start`), `FIXFRAME_PROVIDER_MODE` / `META_API_BASE_URL` semantics from B, and A's accessible names. No contract changes requested.
