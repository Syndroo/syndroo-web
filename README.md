# Syndroo website and documentation

Website and documentation source: two independently built static sites plus the
shared brand assets in `packages/brand/assets/`. Everything runs locally, and
this repository carries no deployment pipeline of its own: Cloudflare Pages
builds and publishes the sites from the dashboard configuration recorded in the
deployment guide below. The pages call no third-party asset or analytics API at
runtime; the docs search fetches its own local pages.

- Design contract: [docs/design.md](docs/design.md)
- Acceptance record: [docs/acceptance.md](docs/acceptance.md)
- Deployment guide: [docs/cloudflare-pages.md](docs/cloudflare-pages.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Product repository: <https://github.com/Syndroo/syndroo>

## Hosting

Cloudflare Pages hosts the two sites. Each project keeps its own `*.pages.dev`
project domain, and the custom domains are the primary hostnames:

| Site | Primary hostname | Project domain |
| --- | --- | --- |
| Website | <https://syndroo.com> | <https://syndroo-web.pages.dev> |
| Documentation | <https://docs.syndroo.com> | <https://syndroo-docs.pages.dev> |

The custom domains are attached in the Pages dashboard. Build commands, output
directories, environment variables and the custom-domain mapping are recorded in
[docs/cloudflare-pages.md](docs/cloudflare-pages.md).

## Requirements

Node.js 24 or newer and npm. The build uses Node's built-in TypeScript type
stripping, so no compiler or framework package is required. `npm ci` installs
the workspace layout from `package-lock.json`.

## Commands

Run everything from the repository root.

```bash
npm ci           # install workspace dependencies
npm run build    # build both sites into their own dist/
npm run check    # verify built artifacts and internal links
npm test         # run the Node test fixtures
npm run dev      # build once, then serve both sites on loopback
npm run preview  # serve the already-built output
```

Focused builds and single-app previews:

```bash
npm run build:website
npm run build:docs
npm run preview --workspace apps/website
npm run preview --workspace apps/docs
```

`npm run dev` builds and then serves. It does not watch the filesystem, so
re-run `npm run build` after editing a source file, or use `npm run
build:website` / `npm run build:docs` for the app you changed.

## Local origins

Both preview servers bind `127.0.0.1` only and print the URLs they serve.

| App | Default origin |
| --- | --- |
| `apps/website` | `http://localhost:4173/` |
| `apps/docs` | `http://localhost:4174/` |

## Build-time origins

The two sites link to each other by absolute URL, so the build needs to know
both origins. The local defaults are the loopback pair above. Point them at the
hosts you serve from:

```bash
WEBSITE_ORIGIN=https://syndroo.com \
DOCS_ORIGIN=https://docs.syndroo.com \
npm run build
```

Each value must be a plain HTTP(S) origin: scheme and host, optional port, with
no path, query, fragment or credentials, and the two values must differ. The
build fails with a clear error when a value does not qualify.

## Repository layout

```text
apps/website/     marketing site: pages in src/pages/, CSS in src/static/css/,
                  browser TypeScript in src/js/, plus its own build output
apps/docs/        documentation site: pages in src/pages/, styles.css in
                  src/static/, browser TypeScript in src/js/, plus its own
                  build output
packages/brand/assets/  the only home of the shared marks: logo, favicon, the
                  three mascot artworks and the five platform SVGs, documented
                  in packages/brand/PROVENANCE.md
scripts/          build, dev, check and preview entry points
tests/            Node fixtures for artifacts, links and server behaviour
.github/          CI that builds, checks and tests (no deployment)
```

Each app builds a self-contained output directory holding its own HTML, CSS,
generated browser JavaScript and copies of the shared brand assets it uses, so
either site can be served from its own output without the other. The brand
assets package remains the single source for every shared mark, and both builds
copy those files unchanged.

Page sources are authored HTML and CSS, with TypeScript for browser behaviour.
Built output is generated: change the source and rebuild instead of editing
built files.

## Content status

The product candidate is `0.2.0-rc.1`: prepared, unpublished, untagged and
undeployed. Threads and Bluesky are exercised against local mock servers with
live acceptance still pending; X, Tumblr and LinkedIn are experimental. The
interactive publish demo on the marketing site is simulated in the browser and
performs no network request. Privacy and Terms are drafts pending operational
and legal review. See [docs/design.md](docs/design.md) for the full contract.

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
