# Demo Evidence Photo Assets

This directory is the provenance register for photographs used or considered for FixFrame's demo evidence scenarios.

> **Status (2026-11-04):** optimised derivatives of all four photographs are committed under `public/demo-assets/evidence/`, with fixture masks for three of them under `public/demo-assets/masks/`. Three photographs are used by scenarios; the fourth remains an unused candidate.

## Asset status

| Local file (`public/demo-assets/evidence/`) | Creator / source | Licence | Scenario status |
|---|---|---|---|---|
| `ceiling-water-damage.jpg` | Atomicdragon136, Wikimedia Commons — [source file](https://commons.wikimedia.org/wiki/File:Ceiling_water_damage.jpg) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Used: `water-ingress-01` |
| `industrial-pipes-corrosion.jpg` | Attila Lénert, Unsplash — [source photo](https://unsplash.com/photos/rusty-industrial-pipes-and-valves-in-a-factory-6uJTDNz6n0k) | [Unsplash License](https://unsplash.com/license) | Used: `pipework-corrosion-04` |
| `bridge-concrete-spalling.jpg` | OregonDOT, Wikimedia Commons — [source file](https://commons.wikimedia.org/wiki/File:Spalling_concrete_on_the_pier_columns.jpg) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | Used: `concrete-spalling-05` |
| `bridge-corrosion-usgs.jpg` | Oklahoma-Texas Water Science Center, USGS — [source page](https://www.usgs.gov/media/images/corrosion-a-pedestrian-bridge) | Public Domain (as stated on the USGS source page) | Not used; secondary candidate |


## Licence boundary

The root [MIT License](../../LICENSE) applies to original FixFrame code and project documentation only, not to these photographs. Each image retains its own terms. See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) for the project-wide exclusions and reuse notes.

## Reviewed but not selected for the initial bundled set

- **Damaged electrical enclosure with exposed wiring** — [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:Exposed_wiring_within_a_damaged_electrical_enclosure,_likely_for_internet_or_power_distribution.jpg), by ShriniwasGajare, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The photograph visibly contains a phone number and other identifying text. Do not bundle or use in a public-facing demo until that information has been assessed and, if appropriate, redacted in a properly attributed ShareAlike derivative. The image must not be used to infer electrical safety or prescribe work.
- **Ethernet cable close-up** — [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:Ethernet_cable_closeup.JPG), by Dmitry “EthernetCable” Bulatović, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The image is primarily a close-up of an RJ45 connector and does not clearly show a damaged cable sheath; it is not a strong match for the proposed cable-damage scenario.

## Attribution and reuse requirements

### CC BY 3.0 — ceiling photograph

Credit: **Atomicdragon136**, “Ceiling water damage.jpg”, via Wikimedia Commons, licensed under [Creative Commons Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/).

If modified, state that changes were made. Do not imply endorsement by the creator.

### Unsplash License — industrial pipes photograph

Photograph by **Attila Lénert** via Unsplash. The source page states that it is free to use under the [Unsplash License](https://unsplash.com/license). Retain this source record and verify the current licence terms before any redistribution outside this repository or use in a public release.

### CC BY 2.0 — bridge concrete photograph

Credit: **OregonDOT**, “Spalling concrete on the pier columns”, via Wikimedia Commons (originally posted to Flickr), licensed under [Creative Commons Attribution 2.0 Generic](https://creativecommons.org/licenses/by/2.0/).

If modified, state that changes were made. Do not imply endorsement by the creator.

### USGS — bridge corrosion photograph

Source: **Oklahoma-Texas Water Science Center, U.S. Geological Survey**, “Corrosion on a pedestrian bridge” (24 October 2018). The USGS source page marks the image **Public Domain**. Retain the source credit and link even though attribution is not a condition of public-domain reuse.

## Use in FixFrame

These are real-world reference photographs used only as visual inputs for a demo prototype. They are not evidence of a FixFrame customer site, asset, incident, inspection, or maintenance outcome.

- Keep source photographs unchanged as the original evidence. If a crop, resize, redaction, or other derivative is needed, preserve the original separately and document the derivative.
- Store provenance alongside each image: source URL, creator, licence, retrieval date, local filename, and any modifications.
- Do not add fictional site, asset, technician, or incident details to the photograph itself. Scenario metadata and transcripts are authored for the demo and are not facts about the photographed asset.
- Do not infer root cause, hidden damage, asset identity, structural integrity, electrical condition, safety status, or repair procedure from a photograph alone.
- Keep all model-generated descriptions reviewable and require human confirmation before creating a work order.

## Before adding image binaries

1. Download the original or an appropriately sized source file from the linked source page.
2. Verify the file opens and its dimensions/content match the intended scenario.
3. Record the retrieval date and exact source/licence information.
4. Check for personal information, faces, logos, location metadata, and other sensitive details.
5. Add the image file beside this README and update the table's status.
6. Ensure the app references only files that actually exist in the repository.

## Asset status

Retrieved 2026-11-04. Changes made to each photograph: EXIF orientation applied, all EXIF/GPS metadata removed (ICC profile kept), resized so the long edge is 1600 px (Lanczos), saved as progressive JPEG, quality 82, 4:2:0. No cropping, colour correction or retouching. JPEG rather than WebP because Meta's supported image formats are not verified in `docs/META_API_NOTES.md`.

| Local file (`public/demo-assets/evidence/`) | Original | Optimised | Fixture mask / box (x, y, w, h) | Used in app |
|---|---|---|---|---|
| `ceiling-water-damage.jpg` | 3264x2448, 1,134,902 B | 1600x1200, 271,114 B | `masks/ceiling-water-damage.png`, 480, 180, 569x469 | `water-ingress-01` |
| `industrial-pipes-corrosion.jpg` | 4848x3232, 3,765,150 B | 1600x1067, 412,707 B | `masks/industrial-pipes-corrosion.png`, 435, 533, 756x428 | `pipework-corrosion-04` |
| `bridge-concrete-spalling.jpg` | 4912x7360, 12,854,220 B | 1068x1600, 357,897 B | `masks/bridge-concrete-spalling.png`, 407, 816, 190x632 | `concrete-spalling-05` |
| `bridge-corrosion-usgs.jpg` | 2988x1992, 719,222 B | 1600x1067, 332,225 B | none | No (kept as a secondary candidate) |

Original download sources: the two Wikimedia files from `upload.wikimedia.org` (SHA-1 matches the Commons API); the USGS file from the "Original" link on its source page; the Unsplash file from the image CDN at its 4848x3232 original size.

The fixture masks are authored demo fixtures, not model output and not ground truth: a colour test inside a hand-chosen region, then morphological clean-up (see `build.py`). Known imperfection: the pipework mask also covers the orange equipment nameplate beside the joint.

The ceiling photograph's EXIF in the original contains GPS coordinates; they are not in the derivative. The photographs are not evidence of any FixFrame site, asset or incident. The damaged electrical enclosure photograph is still excluded.
