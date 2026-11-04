# Release status — 2026-11-04

Evidence: [QA_REPORT.md](QA_REPORT.md). The repository is public, the hackathon entry has been submitted, and the app is deployed from `main`. This page records what was verified and what remains.

## What is integrated

Scenario gallery (5 scenarios, some with real third-party photographs, see ADR 0003 and `docs/DEMO_DATA.md`), evidence workspace, SAM 3.1 segmentation, Muse Spark 1.3 extraction, review and confirm, work order with checklist, status, feedback and audit timeline, provenance chips (`LIVE_META`, `DEMO_FIXTURE`, `USER_EDIT`), session-only bring-your-own key, fixture and live providers with no silent fallback, hardened provider layer, CI, and the acceptance, browser and manual live-smoke test suites.

## Verified versus only implemented

| Area | Verified by D | Notes |
|---|---|---|
| Build, lint, typecheck, 210 unit tests; 66 acceptance and 38 Playwright tests (desktop, mobile width, live-mode mock) | Yes, on `main` @ `30f3340` + QA changes | CI is the final gate |
| Fixture flow, provenance, human confirmation, audit timeline | Yes | |
| No hidden fallback; error codes and HTTP statuses; BYOK precedence and rejection | Yes (mock upstream, plus a real bad-key call) | |
| Secrets not in bundles, HTML, responses, logs, URLs or storage | Yes | |
| Full-history secret scan | Yes: no leaks on the last CI run I saw | Re-run on the final commit |
| Real Meta calls | **One scenario, one call each, 2026-11-04, twice (including on the real-photo build)** | Other scenarios and the live screenshots are agent-reported |
| Accessibility, browsers | Focus, Enter, alerts, no horizontal overflow; Chromium only | No axe/WCAG audit |

## Licensing

Code and docs: MIT (`LICENSE`); third-party inventory and the SAM License text for the runtime dependency `@meta-sam/parser`: `THIRD_PARTY_NOTICES.md` and `licenses/`, all added in PR #15. Synthetic assets: CC0 (`assets/README.md`); real photographs: see `assets/demo-evidence/README.md`. This is an engineering inventory, not legal advice.

## Remaining items

1. **Rotate the Meta API key** that was pasted into chat during QA.
2. The four open UI issues in QA_REPORT, above all the stale overlay after a failed re-segmentation.
3. Re-run live smoke on any later change to the providers or scenario images.
4. If more changes land, re-run the full suite; CI does so on every push and pull request.

Claims to avoid: accuracy, safety, time saved, or live results beyond what QA_REPORT records.
