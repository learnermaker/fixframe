# Third-party notices

FixFrame's own code is MIT-licensed (see [LICENSE](LICENSE)); its synthetic images are CC0 (see [assets/README.md](assets/README.md)). This repository does **not** vendor any third-party source: packages are installed from npm using `package-lock.json`. This file records what that install brings in, so anyone who distributes a build, container image or bundle knows which notices travel with it.

Compiled from the `package.json` `license` field of every package installed on 2026-11-04 (`npm ci`, whole app tree including dev dependencies). It is an engineering inventory, **not legal advice**; re-run it when dependencies change.

## Needs attention before you redistribute a build

| Package | Used for | Licence | What to do |
|---|---|---|---|
| `@meta-sam/parser` 0.1.0 | Runtime. Decodes SAM 3.1 mask output (`src/server/providers/samProvider.ts`) | **SAM License** (Meta, custom, last updated 2025-11-19; not an OSI licence) | Its `LICENSE` ships inside the npm package. If you distribute the SAM Materials (e.g. a container image or a bundled server that includes this package), you must pass on a copy of that licence. It also requires compliance with trade-control laws (no ITAR or prohibited end uses), forbids reverse engineering of the materials, and ends your rights if you sue Meta over the materials. Read the full text at `node_modules/@meta-sam/parser/LICENSE`. Pushing this repository to GitHub does not itself distribute the package; shipping a built artifact might. |
| `sharp` platform binaries (e.g. `@img/sharp-*`) | Optional, pulled in by Next.js image handling | Apache-2.0 AND LGPL-3.0-or-later (libvips) | Keep the notice with any binary distribution. Not modified by this project. |
| `axe-core`, `lightningcss` (+ platform binary) | Dev/build tooling only (accessibility lint, CSS) | MPL-2.0 | File-level copyleft on those files only; not modified or shipped in the app. |
| Barlow, Barlow Condensed (Google Fonts) | UI typefaces, fetched by `next/font/google` at **build time** and self-hosted in the build output | SIL Open Font License 1.1 | Include the OFL notice if you ship the built fonts. The build needs network access to fetch them. |
| `resvg` (not installed) | Optional build-time tool to regenerate demo PNGs (`assets/README.md`) | MPL-2.0 | Never added to `package.json`. |

## Licence mix in the installed app tree

MIT 363, Apache-2.0 25, ISC 20, BSD-2-Clause 9, BSD-3-Clause 3, BlueOak-1.0.0 4, MPL-2.0 3, MIT-0 2, 0BSD 2, CC0-1.0 2, CC-BY-4.0 1 (`caniuse-lite` data), Python-2.0 1 (`argparse`), SAM License 1, Apache-2.0 AND LGPL-3.0-or-later 1.

Direct runtime dependencies: `next`, `react`, `react-dom`, `zod` (all MIT) and `@meta-sam/parser` (above). The separate `tests/` package adds only dev tooling: `@playwright/test` (Apache-2.0), `vitest` (MIT), `typescript` (Apache-2.0), `@types/node` (MIT).

## Meta services

Calling the Meta Model API is governed by Meta's own terms for your account and key, not by this repository's licence. FixFrame makes no claim about those terms. Demo model output is not endorsed by or affiliated with Meta.
