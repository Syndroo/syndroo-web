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
  resizing. The marketing site uses exactly these three: publishing in the hero,
  queueing in the demo panel and success in the closing call to action.

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
  with `background-color: var(--ink)`, so the strip and the hero destination rows show a single monochrome ink mark
  32px in the platform tiles and 18px in the hero rows.
- The marks identify the platforms the candidate can publish to. They do not imply endorsement by, or partnership with,
  any of those companies, and no platform logo is used as the Syndroo brand.
