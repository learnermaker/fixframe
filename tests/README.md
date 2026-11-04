# FixFrame cross-workstream tests (Workstream D)

Black-box tests of the **production build** over HTTP and a real browser. They define no schemas: response shapes are validated with Workstream C's canonical schemas (`src/lib/contracts.ts`, imported not copied) and expected scenario data comes from `src/data/scenarios.ts`. The package has its own `package.json`, so it adds nothing to the app's dependencies.

## Run (from a clean clone)

```bash
npm ci                              # app deps
META_API_TOKEN=FF_SENTINEL_TOKEN_do-not-leak-7f3a9c npm run build   # fake token at build time lets the secrets test mean something
npm ci --prefix tests
npx --prefix tests playwright install chromium
npm run typecheck --prefix tests
npm run acceptance --prefix tests   # HTTP routes: fixture, live failures, BYOK, secrets (starts its own app instances)
npm run e2e --prefix tests          # Playwright: desktop + mobile (fixture) and live-mode-against-a-mock (BYOK/UI states)
```

Needs Node 24 (the fake upstream process runs a `.ts` file directly). Do not run two builds in the same directory at once.

## Tiers (use the cheapest that covers your change)

| Tier | When | Commands |
|---|---|---|
| 1 | Editing one test | `npx vitest run --config vitest.acceptance.config.ts byok` or `npx playwright test --config playwright.config.ts live-ui` (build once, reuse) |
| 2 | Integration milestone | `npm run typecheck --prefix tests`, full `npm run acceptance --prefix tests`, root `npm run lint && npm run typecheck`, one `npm run build` |
| 3 | Release | Clean clone, everything above plus `npm test`, full `npm run e2e --prefix tests`, the CI secret scan, licence review |

## What runs where

| Suite | App under test | Upstream |
|---|---|---|
| `acceptance/fixture-mode`, `byok` (fixture case) | `FIXFRAME_PROVIDER_MODE=fixture` | none |
| `acceptance/live-failures`, `live-success`, `byok`, `secrets` | live mode, per-test instance | local **mock** (`support/fake-meta.ts`) that records the bearer credential |
| `e2e` projects `desktop-1280x800`, `mobile-375x812` | fixture mode, port 3100 | none |
| `e2e` project `live-mock-desktop` (`byok`, `live-ui`) | live mode, port 3101, no deployment key | mock upstream process on port 3199 |

**The mock is not Meta.** It speaks the documented Responses envelope that `src/server/providers/metaClient.ts` expects. It proves how our routes and UI treat well-formed, malformed, rejected and slow answers; it says nothing about real SAM / Muse Spark behaviour. SAM *success* decoding (real mask payloads) is not covered. `LIVE_META` appearing in a mock-backed test is not live verification.

## Selector contract

All accessible names are in `e2e/ui.ts`, taken from the real components (checked 2026-11-04). If a label changes, update that one file; do not loosen the assertions.

## Known behaviours the tests encode (from the code, not from a spec)

- HTTP status per error code: `UNCONFIGURED` 503, `TIMEOUT` 504, `RATE_LIMITED` 429, `UPSTREAM_ERROR` 502, `INVALID_RESPONSE` 502, `UNSUPPORTED_INPUT` 400, `SAFETY_REVIEW_REQUIRED` 422 (`src/server/providers/route.ts`).
- Unset `FIXFRAME_PROVIDER_MODE` means **live**; fixtures need an explicit opt-in.
- Upstream timeout is a fixed 60 s, so the two TIMEOUT tests take ~60 s (run concurrently).
- The BYOK panel exists only in live mode.

## Not automated

Persistence on refresh (documented limitation), a WCAG audit, screenshot/recording secret review, real-device mobile, live Meta smoke tests.
