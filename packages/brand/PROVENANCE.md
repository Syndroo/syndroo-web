# Brand asset provenance

Private provenance note for every file in `packages/brand/assets/`. This note is
repository documentation, not part of a published site: the build copies only
asset files into `dist/assets/`, so no Markdown, source or provenance text is
served.

## Logo and favicon

- `logo.svg` is an unmodified copy of the product repository's branching mark
  `scratch/outputs/svg-kit/logo-tight.svg`. It is the mark drawn in the shared
  mascot kit, so it is copied rather than redrawn.
- `favicon.svg` is a byte-identical copy of the same `logo-tight.svg` mark, kept
  identical on purpose so the interim identity does not mix in the older
  flat-nodes favicon.

## Mascot artwork

- `droo-publishing.png`, `droo-queueing.png` and `droo-success.png` are the three
  original mascot artworks, copied from the product repository's
  `scratch/outputs/mascot-kit-v2/` kit without regeneration, recolouring or
  resizing. The marketing homepage places two of them: `droo-queueing.png`
  beside the dry-run panel and `droo-success.png` in the closing call to action.
  `droo-publishing.png` stays in the kit and in the exported assets but the
  current homepage does not place it. All three are copied into each build by
  `scripts/prepare-assets.ts`, which copies the directory wholesale.

## Platform icon sources

Five platform marks are stored locally as `platform-<name>.svg` so the site never requests a CDN, icon font or third
party host at runtime.

| File | Icon | Source URL |
| --- | --- | --- |
| `platform-threads.svg` | Threads | https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/threads.svg |
| `platform-bluesky.svg` | Bluesky | https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/bluesky.svg |
| `platform-x.svg` | X | https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/x.svg |
| `platform-tumblr.svg` | Tumblr | https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/tumblr.svg |
| `platform-linkedin.svg` | LinkedIn | https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/linkedin.svg |

Provenance details:

- Project: Simple Icons, pinned release `simple-icons@13.21.0`.
- Package source: jsDelivr mirror of the published npm package, path `icons/<slug>.svg`.
- Upstream repository: https://github.com/simple-icons/simple-icons
- License: https://github.com/simple-icons/simple-icons/blob/13.21.0/LICENSE.md - CC0 1.0 Universal, including no
  trademark waiver. Pinned license verified 2026-09-17; keep this provenance note with the files.
- Retrieved: 2026-09-17, one request per icon, no transformations applied to the downloaded bytes.

Verification of the stored files:

- SHA-256:
  - `platform-threads.svg` `8d4e0be28b72e417b02ae2e8f1d1ca4e3ab4adc025e6a1e2451b6d979f16d47a`
  - `platform-bluesky.svg` `f4438b861cae7e4ce890a1de2bd9bafde0541521926420193cbe39da82475c0b`
  - `platform-x.svg` `be03adbfce4a46c4e42eae5ee7b5e676b59627fa25e15a317e453bb18153ff5f`
  - `platform-tumblr.svg` `25c6d78e5606fab85d0d3a8424108be7ddd70bee872cb9cff472568107a34bfc`
  - `platform-linkedin.svg` `2687ac468d96bd03e748dc8646ef6465cb4cc7f34b96e1d0bc86fcb3dd79121a`
- Each file is a self-contained `<svg viewBox="0 0 24 24">` with a single `<path>` and a `<title>`. There is no
  `<script>`, `<foreignObject>`, `<image>`, `xlink:href`, external `href` or `url(http...)` reference.

How the site uses them:

- The SVGs keep their original bytes and default black fill. The stylesheet renders each one through CSS `mask-image`,
  so a page takes the mark in whatever colour it sets and no recoloured copy is stored. The homepage's three
  destination tiles set a white mark on each platform's own colour (`#0285ff` for Bluesky, `#000000` for Threads,
  `#0a66c2` for LinkedIn); the footer icon row sets a 16px ink mark. Both use the same `mark` mask rule, and the
  unused marks stay in the kit rather than being deleted.
- The marks identify the platforms the candidate can publish to. They do not imply endorsement by, or partnership with,
  any of those companies, and no platform logo is used as the Syndroo brand.

## Self-hosted fonts

The shared shell loads two font families from `packages/brand/assets/fonts/`. They
are served from each site's own `/assets/fonts/` path, so no page makes a font
request to a third-party host at runtime. Both families are licensed under the
SIL Open Font License 1.1, which permits redistribution and self-hosting; the
verbatim licence text is stored next to each file.

| File | Family and style | Source URL |
| --- | --- | --- |
| `inter-latin-var.woff2` | Inter, variable weight axis (`wght` 100-900), upright, latin subset | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2 |
| `prompt-500-latin.woff2` | Prompt, static Medium (500), upright, latin subset | https://fonts.gstatic.com/s/prompt/v12/-W_8XJnvUD7dzB2Ck_kIaWMuUZctdg.woff2 |
| `Inter-OFL.txt` | SIL Open Font License 1.1, Inter | https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt |
| `Prompt-OFL.txt` | SIL Open Font License 1.1, Prompt | https://raw.githubusercontent.com/google/fonts/main/ofl/prompt/OFL.txt |

Provenance details:

- Licence: SIL Open Font License, Version 1.1. Inter is copyright 2020 The Inter
  Project Authors (https://github.com/rsms/inter); Prompt is copyright 2015 Cadson
  Demak (info@cadsondemak.com). The stored `OFL.txt` files are unmodified apart
  from normalising `Prompt-OFL.txt` line endings from CRLF to LF, which the build
  audit requires of published text files.
- Google Fonts metadata confirming both families are OFL and that Inter ships as a
  variable font while Prompt ships as static instances was read from
  https://github.com/google/fonts/tree/main/ofl/inter and
  https://github.com/google/fonts/tree/main/ofl/prompt.
- Retrieved: the two `woff2` files with a single request each on 2026-09-28, using
  a desktop Chrome user agent so Google served `woff2` rather than legacy
  formats. No repacking, subsetting, renaming or glyph editing was applied to the
  downloaded bytes.
- Verified: both files decode as `Web Open Font Format (Version 2), TrueType`. The
  table directory of `inter-latin-var.woff2` contains `fvar`, `gvar`, `avar` and
  `HVAR`, so it is a genuine variable font; `prompt-500-latin.woff2` contains no
  `fvar` table, so it is a single static instance.

Verification of the stored files:

- SHA-256:
  - `inter-latin-var.woff2` `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4`
  - `prompt-500-latin.woff2` `7f38cd2182894621467a8569438d2d0ccf2f2aed4c33d678ab77aefbd8dbe4a0`
  - `Inter-OFL.txt` `5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57`
  - `Prompt-OFL.txt` `74584d937293a9cacdcd2eb05851b71aa1527901c18b87961d2f877c77a1b486`
- Both `woff2` files and both `OFL.txt` licence texts are published: the export
  allowlist covers `.woff2` and `.txt`, so each site serves the fonts and their
  licences from its own `/assets/fonts/` path.

How the sites use them:

- The shared shell declares one `@font-face` per family: Inter over its full
  `100 900` weight range and Prompt at `500`, both with `font-display: swap`.
- `--font-sans` is the Inter stack for body text on both sites, and
  `--font-display` is the Prompt stack used for display headings and the brand
  wordmark. Neither family is loaded from a CDN, and no page depends on a font
  being present for layout to hold: both stacks end in the platform UI sans.
