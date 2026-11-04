# Demo capture checklist

Derived from `DEMO_SCRIPT.md` (180 s) and the recording rules there. Nothing below has been performed yet.

## Before recording
- [ ] Fresh clone, `npm ci && npm run build` succeeds; `npm test` and `npm run acceptance --prefix tests` green (see `docs/QA_REPORT.md`).
- [ ] Decide mode **before** recording and say it on screen: `live` (only if a successful call is visible) or `fixture` (badge `DEMO_FIXTURE` visible). Never mix narration and mode.
- [ ] If live: valid server-side key in local `.env` (never shown). Do a dry run; if either SAM or Muse Spark fails, record the fixture-mode backup and say so.
- [ ] Browser: clean profile, 1280x800 (or 1920x1080 scaled), zoom 100-125%, notifications off, no bookmarks bar/extension icons, no `.env`/terminal/dashboards visible.
- [ ] Mic check; narration audible; script rehearsed to <= 2:50.

## Shot list (per `DEMO_SCRIPT.md`)
| Time | Must be visible | Must be said / must not be said |
|---|---|---|
| 0:00-0:15 | Gallery, `SYNTHETIC DEMO DATA` banner, ceiling-tile scenario selected | Synthetic, not a real incident |
| 0:15-0:35 | Source photo, fictional site/area, transcript | Cause and safety are not inferred |
| 0:35-1:00 | Segmentation overlay + provenance chip | Say "SAM" only if the chip reads `LIVE_META`; otherwise "fixture mask" |
| 1:00-1:25 | Structured issue, unknowns | Say "Muse Spark" only if chip reads `LIVE_META` |
| 1:25-1:50 | Edit location/urgency; `USER_EDIT` marker | Reviewer is responsible |
| 1:50-2:25 | Confirm -> create work order; tick checklist; change status; add feedback | Checklist is administrative, not repair steps |
| 2:25-2:45 | Audit timeline with distinct provenance | |
| 2:45-3:00 | Architecture + limitations | Prototype on synthetic data; no validation, accuracy, ROI or safety claims |

## Recording rules (hard)
- [ ] No invented timings, accuracy, ROI or safety numbers.
- [ ] No secrets, account names, or terminal sequences on screen.
- [ ] Total length < 3:00; verify the hackathon's exact upload rules separately.
- [ ] Text legible at the exported resolution.

## After recording
- [ ] Watch the full export once: chips match narration at every point.
- [ ] Link opens logged-out/incognito.
- [ ] Description text matches what was actually shown (live vs fixture).
