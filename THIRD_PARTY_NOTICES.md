# Third-party notices

This file records important third-party components and media used by FixFrame. It is not a substitute for the licence text supplied with each component or the terms that apply to hosted services.

## Scope of the FixFrame project licence

The root [MIT License](LICENSE) applies to original FixFrame source code and project documentation authored for this repository, except where a file or component is identified as third-party material or otherwise carries its own terms.

The MIT License does **not** relicense:
- Third-party photographs and other media under `public/demo-assets/` or elsewhere in the repository.
- The `@meta-sam/parser` package or other third-party dependencies.
- Meta models, Meta Model API services, model outputs, or other hosted services.
- Any third-party trademarks, names, logos, or other protected material.

Those materials remain subject to their own licences, terms, and attribution requirements. A dependency being listed in `package.json` does not transfer its licence to FixFrame.

## Direct application dependency with separate terms

### `@meta-sam/parser`

- Publisher/source: Meta's Meta-SAM client libraries.
- Package: https://www.npmjs.com/package/@meta-sam/parser
- Source repository: https://github.com/meta-models/meta-sam
- Licence: **SAM License**, not MIT.
- Licence text: https://github.com/meta-models/meta-sam/blob/main/LICENSE
- FixFrame uses the package as an installed dependency; it does not relicense or claim ownership of the package.

The SAM License grants limited rights subject to its own conditions. Anyone redistributing the SAM Materials or derivative works must follow that agreement, including its requirement to provide a copy of the agreement. Check the exact version installed and its accompanying licence before redistributing a built bundle or modified SAM Materials. The package's licence may change independently of FixFrame.

## Demo photographs

The following photographs are used as visual inputs in demo scenarios. They are not photographs of FixFrame customer sites, assets, incidents, or maintenance outcomes. Optimised derivatives were created by applying EXIF orientation, removing EXIF/GPS metadata while retaining the ICC profile, resizing to a maximum 1600 px long edge, and saving as progressive JPEG quality 82. No crop, colour correction, or retouching was applied.

| Local asset | Creator / source | Licence and attribution |
|---|---|---|
| `public/demo-assets/evidence/ceiling-water-damage.jpg` | Atomicdragon136, “Ceiling water damage.jpg”, Wikimedia Commons | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Attribute the creator and source; indicate that the file was resized and metadata removed. Source: https://commons.wikimedia.org/wiki/File:Ceiling_water_damage.jpg |
| `public/demo-assets/evidence/industrial-pipes-corrosion.jpg` | Attila Lénert, Unsplash | [Unsplash License](https://unsplash.com/license). Source: https://unsplash.com/photos/rusty-industrial-pipes-and-valves-in-a-factory-6uJTDNz6n0k. Retain attribution as a courtesy; do not treat this image as MIT-licensed or assume it may be redistributed separately from the permitted use. |
| `public/demo-assets/evidence/bridge-concrete-spalling.jpg` | OregonDOT, “Spalling concrete on the pier columns”, via Wikimedia Commons / Flickr | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). Attribute the creator and source; indicate that the file was resized and metadata removed. Source: https://commons.wikimedia.org/wiki/File:Spalling_concrete_on_the_pier_columns.jpg |

The USGS bridge-corrosion image listed as a secondary candidate in the asset register is not used by the application and is not included in the three-photo attribution table above. Its source record is retained in [the asset provenance register](assets/demo-evidence/README.md).

## Other software dependencies

FixFrame's direct and transitive npm dependencies retain the licences declared by their respective publishers. The dependency manifest and lockfile identify the installed package versions; consult each installed package's own licence file and the corresponding package metadata for the terms that apply. The root MIT License does not override those terms.

Before distributing a production bundle, container, or other package that includes third-party dependency code, generate and review a current software bill of materials (SBOM), verify the licence metadata against the exact lockfile, and include any notices required by the relevant licences. Do not assume this short notice is a complete SBOM.

## Meta services and trademarks

FixFrame calls Meta Model API services. API access and use of Meta models are governed by Meta's applicable service, model, and platform terms, not by the root MIT License. “Meta”, “SAM”, and related product names are used to identify the services and components integrated by this project; no endorsement or affiliation beyond the documented API integration is implied.

## Questions and corrections

If you identify a missing attribution or an incorrect licence reference, open an issue with the affected file path and source URL. Do not remove or alter required attribution when making a permitted derivative.
