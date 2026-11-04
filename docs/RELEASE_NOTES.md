# Release readiness — 2026-11-04

Evidence is in [QA_REPORT.md](QA_REPORT.md) (tested commit `724aa04` on `main` @ `11674ed`). The repository is **still private**; nothing here changes that.

## Readiness, by decision

| Decision | Ready? | Why |
|---|---|---|
| **Demo / recording** | **Yes, in fixture mode. Yes for live mode with care.** | The full fixture flow passes browser tests at desktop and mobile width and is labelled throughout. A real Meta key worked end to end for one scenario on 2026-11-04. Fix UI items 1 and 4 first (below) or avoid re-running segmentation on camera. Say "fixture" unless a `LIVE_META` chip is on screen. |
| **Hackathon submission** | **Nearly.** | Needs the maintainer's licence confirmation, a rotated key, the submission-form items in `SUBMISSION_CHECKLIST.md`, and a recorded demo. Do not claim live results beyond what was run (QA report §4). |
| **Making the repository public** | **Not recommended yet.** | Blocked only by the items under "Before public release". None is large, but they are decisions and a cleanup, not code. |

## What is integrated

Frontend (scenario gallery, evidence workspace, review and confirm, work order, checklist, status, feedback, audit timeline, provenance chips, error and retry states), server routes with fixture and live providers (SAM 3.1, Muse Spark 1.3), session-only bring-your-own key, domain contracts and workflow, synthetic assets under CC0, hardened provider layer, CI with a full-history secret scan, and the acceptance, browser and manual live-smoke test suites.

## Verified (by me, on the tested commit) versus merely implemented

| Area | Verified | Only implemented or agent-reported |
|---|---|---|
| Build, lint, typecheck, 191 unit tests, clean clone | Yes | |
| Fixture flow, provenance, human-confirmation gate, audit timeline | Yes (Playwright, desktop and 375x812) | |
| No hidden fallback; `UNCONFIGURED`; error codes and HTTP statuses | Yes (against a local mock upstream) | |
| BYOK precedence, rejection, no retry with the deployment key, clear and refresh | Yes (mock upstream and browser) | |
| Secret non-disclosure in bundles, HTML, responses, logs, URLs, storage | Yes | Screenshots: 3 of 8 inspected, no key seen |
| Full-history secret scan | Yes: 33 commits scanned, no leaks | |
| Real Meta calls | **One scenario, one call each, 2026-11-04** | Three-scenario live runs and the live screenshot are agent-reported |
| Accessibility | Focus, Enter, alerts, no horizontal overflow | No axe/WCAG audit, no screen reader |
| Browsers | Chromium only | Firefox, WebKit, real phones |

## Open issues

UI items from QA_REPORT §6: (1) Extract enabled before segmentation, (2) evidence row key collisions, (3) non-Latin-1 key error message, (4) stale overlay after a failed re-segmentation. No critical or high-severity issue is open.

## Licensing and third-party notices

- Code and docs: **MIT** (`LICENSE`), added at the maintainer's request on 2026-11-04. Choosing MIT was my default; the maintainer should confirm it or swap it before going public.
- Assets: **CC0 1.0**, declared in `assets/README.md` as a project decision awaiting the maintainer's confirmation.
- `THIRD_PARTY_NOTICES.md` inventories dependency licences. The one to read is `@meta-sam/parser`, a **runtime dependency under Meta's custom SAM License** (not an OSI licence): it must accompany any redistribution of the SAM Materials, carries trade-control and anti-reverse-engineering terms, and ends if you sue Meta over the materials. Hosting the source does not itself distribute it; shipping a built artifact might. Also noted: LGPL image binaries (`sharp`), MPL-2.0 tooling, and Google Fonts (OFL) fetched at build time.
- This is an engineering inventory, not legal advice.

## Before public release

1. **Rotate the Meta key** that was pasted into a chat, and confirm no other key was ever shared.
2. Maintainer confirms the MIT and CC0 choices and the handling of the SAM License dependency.
3. Fix or consciously accept the four UI items; re-run the live smoke test on the final commit.
4. Re-run CI on the final `main` commit and the secret scan once more after the last merge.
5. Check the README, demo recording and submission text say "synthetic" and distinguish fixture from live output.
6. Open the repository in a logged-out window to see what is visible, then change visibility (maintainer only).

Hackathon rules, track selection and deadlines remain the maintainer's to confirm.
