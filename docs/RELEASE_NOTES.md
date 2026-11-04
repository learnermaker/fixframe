# Release readiness — status as of 2026-11-04

Source of truth for gates: `docs/SUBMISSION_CHECKLIST.md` and `docs/TEST_PLAN.md`. Evidence: `docs/QA_REPORT.md`. The repository **remains private**; this document does not change that.

## Recommendation

**Do not make the repository public yet.** The application, licence and assets do not exist, and no test has run against a real build. Re-evaluate after the blockers below are cleared and the pre-public steps are done.

## Blockers

| # | Blocker | Owner |
|---|---|---|
| 1 | No runnable app on `main`; root `package.json` scripts (`lint`, `typecheck`, `test`, `build`, `start`) absent -> CI cannot pass | A/B/C, integration owner |
| 2 | README says setup commands "will be added"; clean-clone install fails today | integration owner (README) after #1 |
| 3 | Core E2E flow never executed; UI selectors unconfirmed | A, then D |
| 4 | Live SAM 3.1 and Muse Spark never smoke-tested (needs credentials) — cannot claim "live" for either | B / user |
| 5 | No `LICENSE`; no code/asset licence decision | integration owner |
| 6 | No synthetic images or `assets/README.md`; asset provenance unverified | C |
| 7 | No third-party notices / dependency licence review for the app | D after #1 |
| 8 | Full-history secret scan with a real tool (gitleaks/trufflehog) not run; manual review of history after all agent PRs merge | D / integration owner |

## Release checklist (from `SUBMISSION_CHECKLIST.md`)

Legend: DONE = verified with evidence; NO = not done; BLOCKED = needs another workstream.

**Technical**
- [NO] Fresh install/build/test — blocked on app
- [DONE, partial] `.env.example` documents `FIXFRAME_PROVIDER_MODE`, `META_API_TOKEN`, `META_API_BASE_URL`; token value is empty; the tracked-env-file / `NEXT_PUBLIC_*` check passed against this repo's real `.env.example` during the harness run
- [DONE, partial] No keys in current git history (regex scan only, docs-only history)
- [BLOCKED] No keys in bundle/logs — test written, needs app
- [BLOCKED] Model IDs/endpoints match official docs — B's responsibility; not reviewed by D
- [BLOCKED] CI green
- [NO] No runtime dependency on private Appdraft source — cannot check without app code; `ARCHITECTURE.md` states the rule

**Open source**
- [NO] Licence chosen, `LICENSE` added, third-party notices
- [NO] Assets verified redistributable
- [NO] Private data/secrets removed from entire history — nothing found in current 5 commits, re-run after merges
- [NO] Make public only after final review (explicitly **not** done)

**Product / demo / submission**: not assessable yet; see `docs/DEMO_CAPTURE_CHECKLIST.md` for the recording prep. Hackathon upload rules, Indie Developer track selection, logged-out URL check and submission confirmation are the maintainer's to verify.

## Pre-public steps (in order)
1. Merge A/B/C; make root scripts exist; CI green on `main`.
2. Run `docs/QA_REPORT.md` commands again on a fresh clone; update the report with real results.
3. Run live smoke tests (A11) with a real key and record outcome; remove or relabel any claim not shown.
4. Choose licence; fill `assets/README.md`; add notices.
5. Secret scan of full history with a dedicated tool; rotate any key that ever touched the repo.
6. Open the repo logged-out/incognito to confirm what is visible, then flip visibility (maintainer only).
