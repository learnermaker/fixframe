# FixFrame cross-workstream tests (Workstream D)

Black-box tests that talk to the **built app** over HTTP/browser. They import no application code and define no schemas, so they cannot drift from Workstream C's contracts; they assert only the transport shape documented in `AGENT_WORKSTREAMS.md`.

Own `package.json` on purpose: it adds no dependencies to the app's root `package.json` (owned by A/B/C).

## Run (from a clean clone)

```bash
npm ci                           # root app deps
npm run build                    # tests run against the production build
npm ci --prefix tests
npx --prefix tests playwright install chromium
npm run typecheck --prefix tests
npm run acceptance --prefix tests   # API / failure-path / secrets (Vitest, starts its own app instances)
npm run e2e --prefix tests          # browser happy path + gating + error UI (Playwright, fixture mode)
```

For the secrets test to be meaningful, build with a fake token in the environment (CI does this):
`META_API_TOKEN=FF_SENTINEL_TOKEN_do-not-leak-7f3a9c npm run build`.

## Requirements these tests place on other workstreams

| From | Requirement |
|---|---|
| root `package.json` (A/B/C) | scripts `lint`, `typecheck`, `test`, `build`, `start` (`next start`, honours `PORT`) |
| B | `FIXFRAME_PROVIDER_MODE=fixture|live`; live + empty `META_API_TOKEN` -> `UNCONFIGURED`; `META_API_BASE_URL` points live calls at the given host; upstream 429 -> `RATE_LIMITED`, 5xx -> `UPSTREAM_ERROR`, bad shape / non-JSON -> `INVALID_RESPONSE`, no answer -> `TIMEOUT`; bad body / unknown scenario -> `ok:false` with HTTP >= 400 |
| B/C | fixture responses use `provenance.source = "DEMO_FIXTURE"`, `provider = "fixture"`, a `fixtureId`; extract returns `status: "needs_review"`, catalog `location`/`assetLabel`, non-empty `unknowns`, no numeric `confidence` |
| A | accessible names listed in `e2e/ui.ts` (banner text `SYNTHETIC DEMO DATA`; buttons matching *ceiling tile*, *segment*, *extract*, *confirm*, *create work order*; labelled fields *title*, *urgency*, *status*, *feedback*; checkboxes for the checklist; a list named *timeline/audit/events*; errors rendered with `role="alert"`; provenance chips rendering `DEMO_FIXTURE` / `LIVE_META` / `USER_EDIT`). Tell D if the real labels differ and the selectors move in one file. |

## Scope and honesty notes

- `live-failures` uses a local fake upstream that **only misbehaves**. It proves failure handling, not compatibility with the real Meta API. Live smoke tests (acceptance A11) need real credentials and are not automated here.
- Browser error-state tests inject failures with `page.route`; they test UI handling of the documented error contract.
- Not automated: keyboard-only navigation (A12), narrow-mobile layout, persistence on refresh, WCAG checks.
