# Demo asset inventory

Every image is a synthetic illustration authored for FixFrame as hand-written SVG. None derives from a photograph, a stock library, a real site, a real person, or a logo.

Licence: released by the FixFrame project under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) so they can be redistributed with the repository whichever code licence is selected. This is a project decision for the maintainer to confirm before public release.

| Published PNG (1280x720) | SVG source | Used by | Depicts |
|---|---|---|---|
| `public/demo-assets/ceiling-tile.png` | `public/demo-assets/src/ceiling-tile.svg` | `water-ingress-01` | Ceiling grid with a discoloured patch on one tile |
| `public/demo-assets/cable-sheath.png` | `public/demo-assets/src/cable-sheath.svg` | `cable-sheath-02` | Disconnected display cable on a bench with a mark on its sheath |
| `public/demo-assets/handrail-bracket.png` | `public/demo-assets/src/handrail-bracket.svg` | `handrail-bracket-03` | Mock handrail with one bracket out of line |
| `public/demo-assets/masks/ceiling-tile.png` | `public/demo-assets/src/masks/ceiling-tile.svg` | fixture `water-ingress-01-mask-v1` | Alpha mask of the patch |
| `public/demo-assets/masks/cable-sheath.png` | `public/demo-assets/src/masks/cable-sheath.svg` | fixture `cable-sheath-02-mask-v1` | Alpha mask of the sheath mark |
| `public/demo-assets/masks/handrail-bracket.png` | `public/demo-assets/src/masks/handrail-bracket.svg` | fixture `handrail-bracket-03-mask-v1` | Alpha mask of the bracket |

The masks are authored by hand from the same outlines as the illustrations. They are fixture data, not model output and not ground truth for any real facility.

## Regenerating the PNGs

Only needed after editing an SVG. The renderer ([resvg](https://github.com/RazrFalcon/resvg), MPL-2.0) is a build-time tool and is not shipped or added to `package.json`. The committed PNGs are the canonical versions.

```bash
npm i --no-save @resvg/resvg-js
```

```bash
node src/data/render-demo-assets.mjs
```

The script prints each mask's bounding box. If a mask changes, copy the new box into `src/data/fixtures.ts`.
