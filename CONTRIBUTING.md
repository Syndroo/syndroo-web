# Contributing

Thanks for helping with the Syndroo website and documentation.

## Sources and build output

Edit authored sources only: pages in `apps/website/src/pages/` and
`apps/docs/src/pages/`, their stylesheet (`apps/website/src/static/css/`,
`apps/docs/src/static/styles.css`), browser TypeScript in each app's `src/js/`,
and the shared `packages/`, `scripts/` and `tests/`. Built output is generated
by the build and is not hand-edited. If a change needs different output, change
the source and rebuild; a pull request that moves generated files without the
matching source change is a bug.

Conventions:

- Use TypeScript for executable code and tests. Node 24's built-in type
  stripping runs these sources, so keep syntax erasable (no enums, namespaces,
  parameter properties or `experimentalDecorators`). Import sibling sources
  with their real `.ts` extension; Node runs those files directly, so do not add
  a `.js` suffix to the import.
- Keep pages static and local. No third-party asset, analytics or tracking
  request, external font, CDN icon or credential read may be added at runtime.
  The docs search reads only the site's own local pages.
- Keep the two sites' outputs independent. Shared marks come from
  `packages/brand/assets/`, the single home for the logo, favicon, mascot
  artwork and platform marks, rather than being copied per page.

## Before opening a pull request

```bash
npm ci
npm run build
npm run check
npm test
```

Run a focused build (`npm run build:website` or `npm run build:docs`) while
iterating, and describe what changed and how you checked it.

## Previewing

`npm run dev` builds and then serves both sites on loopback at the origins
listed in the README. `npm run preview` serves the output that is already
built. Preview servers are local review tools; this repository has no
deployment pipeline and pull requests do not add one.

## Content updates

Website copy is part of the product's public claims, so keep it accurate:

- `0.2.0-rc.1` is a prepared, unpublished candidate. Do not describe it as
  released, tagged, deployed or available from a package registry.
- Platform status stays as recorded: Threads and Bluesky are mock-tested with
  live acceptance pending, and X, Tumblr and LinkedIn are experimental. Do not
  claim a live integration that has not been exercised.
- The interactive demo stays labelled as simulated and must not call a
  publishing API.
- Privacy and Terms remain drafts until an approved policy exists. Do not add
  a controller address, analytics description, effective date or liability
  position.
- Maintainer biography is written from verified input only.
- Displayed brand is `Syndroo`, with the Syndroo copyright line in the footer.
  The legal attribution `Copyright 2026 Grant Dai` in the NOTICE and page
  bodies is deliberate and distinct; keep both.
- Do not redraw the logo, recolour or regenerate the mascot artwork. When you
  add a third-party icon or asset, record its source, license and checksum in
  the provenance note next to the asset.

## Reporting problems

Open an issue for ordinary bugs and content problems. Do not open a public
issue for a suspected vulnerability; use GitHub's private security advisory
reporting instead.

By contributing you agree that your contribution is licensed under the
Apache License 2.0. Do not submit material you do not have the right to
contribute.
