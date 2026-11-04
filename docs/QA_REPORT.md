# QA Report — Workstream D

Date: 2026-11-04. Supersedes the earlier snapshots in PR #7 and the integration-owner notes.

**Tested commit: `724aa04`** (QA branch `agent/qa-revalidation`, rebased on `main` @ `11674ed`, which includes the frontend PR #10, providers PR #11 and provider hardening PR #12). The commit that adds this report changes documentation only; GitHub CI was re-run on it before merge (see the PR). "Verified" below means I ran it myself; "agent-reported" means another agent said so and I did not reproduce it.

## Environments

| | Local | CI |
|---|---|---|
| OS | Windows 11 Enterprise | `ubuntu-latest` |
| Node / npm | 24.21.0 / 11.19.0 | Node 24 (`actions/setup-node@v6`) |
| Browser | Playwright Chromium | Playwright Chromium (cached) |

## 1. Clean-clone regression (local, fresh `git clone` of `724aa04`)

Run with the fake sentinel token in the environment at build time. Durations are wall-clock on a slow Windows machine and are not representative of CI.

| Step | Result | Duration |
|---|---|---|
| `npm ci` | PASS | 462 s |
| `npm run lint` | PASS | 55 s |
| `npm run typecheck` | PASS | 35 s |
| `npm test` (unit) | PASS, **191 tests**, 6 files | 30 s |
| `npm run build` | PASS | 58 s |
| `npm ci --prefix tests` | PASS | 101 s |
| `npm run typecheck --prefix tests` | PASS | 17 s |
| `npm run acceptance --prefix tests` | PASS, **60 tests**, 6 files | 853 s |
| `npm run e2e --prefix tests` | PASS (exit 0; my script truncated the per-test count, CI shows 34) | 172 s |

The 853 s acceptance time is much longer than the 251 s seen earlier with the same suite on a worktree. I set `META_API_TIMEOUT_MS=2000` through a shell function prefix and have not confirmed it reached the app processes, so the two hang tests probably waited the full 60 s default. I have not investigated further. CI sets the variable through the workflow `env:` and is fast.

## 2. GitHub CI (run 41875659236, commit `724aa04`) — all green

| Job | Result | Time |
|---|---|---|
| `secret-scan` | success | 7 s |
| `static` (lint, typecheck, unit tests) | success | 68 s |
| `app` (build, acceptance, Playwright) | success; Playwright 34 passed in 31 s | 3 m 15 s |

Jobs run in parallel; wall-clock is the `app` job. npm and the Playwright browser are cached. The `static` job runs without a build.

**Gitleaks:** pinned CLI v8.30.1 with the release checksum verified, `fetch-depth: 0`, `--log-opts="--all"`. Scope: 39 commits reachable from any ref, **33 commits scanned**, **no leaks found**. An earlier run flagged three of my fake `FF_SENTINEL_*` test keys as `generic-api-key`; they are allowlisted by value in `.gitleaks.toml` (not by path), so a real secret placed in `tests/` would still be caught. The first CI attempts with `gitleaks-action@v2` failed with a 403 (it needs extra PR permissions and only scans PR commits) and were replaced by the CLI scan.

## 3. Earlier regression on PR #12 before it merged (my own runs)

PR #12 head `fd650d3` merged locally with my branch: build, lint, typecheck, 191 unit tests passed; acceptance 50/50 (251 s); Playwright 34/34 (244 s); the 10 new hardening tests (content-type gate, Meta 400/413/408/504 mapping, unsafe evidence, `META_API_TIMEOUT_MS`) 10/10. Before that, the 50 acceptance + 34 Playwright tests also passed against the pre-hardening build with the default 60 s timeout.

## 4. Live Meta smoke test — run, limited

Manual test `tests/live/live-smoke.live.ts`, run **2026-11-04 on the PR #12 build (`fd650d3`)** with a key supplied by the maintainer, passed as the BYOK header (no deployment key), key in an environment variable only. **4 of 4 tests passed in 31 s:**

1. SAM 3.1, scenario `water-ingress-01`: canonical `LIVE_META` segmentation with at least one box (so it passed the frame-size check added in #12).
2. Muse Spark 1.3, same scenario: canonical `LIVE_META` issue, `needs_review`, catalog location and asset kept, non-empty unknowns.
3. A deliberately bad key: rejected by the real Meta API, surfaced as `UPSTREAM_ERROR`, no fixture, no fallback.
4. The key was absent from every response and from the server log.

**Limits:** one scenario, one call each, one day. The box count, latency and request-id presence were printed by the test but not captured here. This says nothing about accuracy, safety, or the other two scenarios. Agent C reports (not reproduced by me) live runs on all three scenarios, and the frontend PR's `08-live-meta-review-desktop.png` shows `LIVE_META` output with request IDs; both are agent-reported. The key was pasted into a chat to enable this test and must be rotated.

## 5. Pass/fail matrix for the follow-up brief

| Requirement | Status | Evidence |
|---|---|---|
| Clean install, lint, typecheck, unit tests, build, server starts | PASS | §1 (verified) |
| Fixture mode works with no credentials; provenance always `DEMO_FIXTURE` | PASS | `fixture-mode` acceptance (3 scenarios, canonical schemas), Playwright |
| Live mode without credentials -> `UNCONFIGURED` (503); unset mode is live | PASS | `live-failures` |
| Live errors never become fixture output | PASS | `live-failures`, `byok`, `live-ui`; no `DEMO_FIXTURE` in any failing response |
| Malformed requests / unknown scenarios fail safely; correct HTTP statuses and codes | PASS | `fixture-mode`, `live-failures`, `provider-hardening` (503/504/429/502/400/422) |
| Non-JSON content types rejected before any upstream call | PASS | `provider-hardening` |
| SAM and Muse responses match canonical schemas | PASS for fixtures, mock upstream and the 1-scenario live call; SAM success decoding with real masks otherwise agent-reported |
| BYOK precedence, request-scoped, not persisted, rejected key never retried with deployment key | PASS | `byok` acceptance (mock upstream records the bearer); live bad-key call |
| Fixture mode ignores live credentials | PASS | `byok` |
| No key in bundles, HTML, responses, logs, URLs, storage, error messages | PASS | `secrets`, `byok`, `byok.e2e` (storage, cookies, URL, DOM), live smoke. **Screenshots/recordings:** only 3 of the 8 frontend screenshots were inspected; no key seen |
| Clear and refresh remove the session key | PASS | `byok.e2e` |
| Fixture flow from scenario to work order; human confirmation mandatory | PASS | `happy-path.e2e`, `gating-and-errors.e2e` (Create work order disabled until Confirm) |
| Edits and workflow events reach the audit timeline | PASS | `happy-path.e2e` (checklist, status, feedback add events); edit provenance chip checked |
| Error and retry states usable | PASS | `live-ui.e2e`, `gating-and-errors.e2e` |
| Desktop 1280x800 and narrow 375x812; no horizontal overflow | PASS (Chromium viewport emulation, not a real phone) | `responsive-keyboard.e2e` in both projects |
| Keyboard-only primary journey; visible focus; `role="alert"` errors | PASS for the path up to review (focus + Enter on controls, focus indicator, alerts). **Not a full keyboard or WCAG audit** |
| Asset/mask consistency | PASS | `assets-masks.e2e`: all 3 masks match image size and fixture box (deliberately shifted box fails the test) |
| Live Meta verified | **PARTIAL** — §4 |
| Dedicated full-history secret scan | PASS | §2 |
| Dependency licence review | DONE, see `THIRD_PARTY_NOTICES.md`; **one non-OSI runtime licence** (SAM License) needs the maintainer's attention |

## 6. Defects and risks found

No critical or high-severity issue was found in my own testing. Open items:

| # | Item | Severity | Owner |
|---|---|---|---|
| 1 | Extract is enabled before segmentation; fixture issues cite `image_region` evidence the reviewer may not have seen highlighted. Recommended: in fixture mode gate Extract on a segmentation result; keep it enabled in live mode | Medium (UI) | UI owner |
| 2 | `IssueReview` keys evidence rows by `ref`, and transcript evidence shares one ref, so duplicate rows can collide | Medium (UI) | UI owner |
| 3 | A session key with non-Latin-1 characters makes browser `fetch` throw; the UI says "server could not be reached" | Low (UI) | UI owner |
| 4 | A failed re-segmentation leaves the old overlay and provenance on screen | Medium (UI, misleading) | UI owner |
| 5 | Work orders can be completed with unchecked checklist items (documented product limitation) | Low | Product |
| 6 | The unsafe-claim filter is phrase matching, not a safety classifier | Known limitation | Product |

Items 1-4 were raised with Agent C and the UI owner; I did not change application code.

## 7. Not tested / limitations

- Live behaviour on scenarios 2 and 3 (my own runs); live SAM/Muse variability; any accuracy or safety claim.
- Default 60 s upstream timeout on the final build (CI and one test use 1-2 s); invalid `META_API_TIMEOUT_MS` values (they should fall back to the default) are not covered by my tests.
- Firefox, WebKit, real mobile devices, screen readers, an axe/WCAG audit, colour-contrast checks.
- Persistence across refresh (state is in memory by design).
- Windows build/runtime in CI (CI is Linux only).
- The build fetches Barlow fonts from Google Fonts, so offline builds fail.
- Agent-reported and not reproduced: the screenshots' provenance, live runs on all three scenarios, Agent A's description of component test coverage (the 191 unit tests as a whole were run by me).
- Branch history: I force-pushed my own PR branch (with lease) after rebasing; no shared history was rewritten.
