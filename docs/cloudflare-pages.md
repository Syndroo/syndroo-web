# Cloudflare Pages deployment

Two Cloudflare Pages projects publish this repository. Both are connected to
`Syndroo/syndroo-web` through the Pages Git integration, build from `main`, and
rebuild automatically when the repository changes. This document records the
dashboard configuration. The repository itself holds no deployment pipeline, no
Wrangler configuration and no credentials. The current configuration is
described first and the dated verification records are kept below. The
verification sections record pre-deployment checks; verify the deployed bytes
after each push.

## Projects

| Setting | `syndroo-web` | `syndroo-docs` |
| --- | --- | --- |
| Repository | `Syndroo/syndroo-web` | `Syndroo/syndroo-web` |
| Production branch | `main` | `main` |
| Root directory | empty (repository root) | empty (repository root) |
| Build command | `npm run build && npm run check && npm test` | `npm run build && npm run check && npm test` |
| Build output directory | `apps/website/dist` | `apps/docs/dist` |
| Dependency install | automatic (`package-lock.json`) | automatic (`package-lock.json`) |
| Custom domain | <https://syndroo.com> | <https://docs.syndroo.com> |
| Project domain | <https://syndroo-web.pages.dev> | <https://syndroo-docs.pages.dev> |

Leave the root directory empty so Pages installs the npm workspace and runs the
root build command from the repository root. Shared build entry points live in
`scripts/` and brand assets in `packages/brand/assets/`.

The build command builds both sites even though each project publishes one of
them. `npm run check` audits `apps/website/out` and `apps/docs/out` together
(`scripts/check.ts`), so building only one app leaves the other without output
and makes the check fail with `no build output found`. `npm test` then runs the
fixtures: build and origin handling, the shared content and navigation contract
for both sites, the CLI contract, and the static-server behaviour. Building both
in one run is cheap for two small static sites and keeps the published output
gated by the same check and test run.

Each build writes one self-contained output directory. Besides the pages, CSS,
assets and generated browser JavaScript, every build now emits
`robots.txt` and `sitemap.xml` from the page registry and the configured origin,
and every page carries a canonical URL plus Open Graph title, description and
URL for its own origin. The current output is the marketing homepage plus the two
technical 404 documents, and the six documentation pages plus their two 404
documents.

## Environment variables

Both projects carry the same three plain-text variables, set for Production and
Preview separately:

| Variable | Value |
| --- | --- |
| `WEBSITE_ORIGIN` | `https://syndroo.com` |
| `DOCS_ORIGIN` | `https://docs.syndroo.com` |
| `NODE_VERSION` | `24` |

Both origins carry the custom domains, so production, previews and the check run
inside the Pages build all reference the primary hostnames. The `*.pages.dev`
project domains keep serving the same build; they are simply no longer the
values written into cross-site links.

Each origin must be a bare http(s) origin: scheme, host and optional port, with
no path, query, fragment or credentials, and the two values must differ. The
build fails with a clear error otherwise (`scripts/lib/origins.ts`).

Each site now uses both origins, and the check enforces both sides:

- its own origin appears in the HTML metadata: one canonical URL and one Open
  Graph URL per registered page. Those references cover HTML only; the generated
  files are counted separately, with the origin in every `sitemap.xml` entry -
  one for the marketing homepage and six for the documentation - and once in each
  `robots.txt`;
- the other site's origin appears in real cross-site links: the marketing
  navigation and footer point at the documentation origin, and the documentation
  topbar and footer point back at the marketing origin, so the two sites resolve
  each other in the configured pair.

`DOCS_ORIGIN` therefore shapes the website's cross-site links, and
`WEBSITE_ORIGIN` shapes the documentation's, while each site's own origin shapes
its metadata and sitemap. Both values are validated as a pair on every build, and
a fixture test fails if a canonical URL or an Open Graph URL does not match the
configured origin of the page it belongs to.

The variables are load-bearing and a missing value fails silently. With them
unset, `npm run build` and `npm run check` both exit 0 while the output ships
loopback links: `scripts/lib/origins.ts` falls back to `http://localhost:4173`
and `http://localhost:4174`, and the audit skips a default that is itself
configured - the same fallback would reach the canonical URLs, the Open Graph
URLs, `sitemap.xml` and `robots.txt`. After changing either project, confirm the
published HTML, sitemap and robots file contain no `localhost:417` reference.

`NODE_VERSION=24` matches `.nvmrc` and the `engines` field. The build image
selects the Node version through `NODE_VERSION` or `.nvmrc`
(<https://developers.cloudflare.com/pages/configuration/build-image/>).

No token, API key, account ID or repository secret is involved. The Git
integration authenticates through its own GitHub App installation, which needs
access to the `Syndroo` organization repository `Syndroo/syndroo-web`; a personal
installation does not cover an organization repository.

## Custom domains

Each Pages project carries one custom domain:

| Pages project | Custom domain | Project domain |
| --- | --- | --- |
| `syndroo-web` | `syndroo.com` | `syndroo-web.pages.dev` |
| `syndroo-docs` | `docs.syndroo.com` | `syndroo-docs.pages.dev` |

Add each hostname under the project's Custom domains tab in the Pages dashboard.
In the `syndroo.com` zone the records are:

| Custom domain | Pages project | DNS record |
| --- | --- | --- |
| `syndroo.com` | `syndroo-web` | `CNAME` `@` -> `syndroo-web.pages.dev` |
| `docs.syndroo.com` | `syndroo-docs` | `CNAME` `docs` -> `syndroo-docs.pages.dev` |

Cloudflare flattens the `CNAME` at the apex, so the bare domain works from the
same record. The certificate is issued automatically and its status appears next
to the hostname in the dashboard.

The origins are baked into the built HTML, so set `WEBSITE_ORIGIN` and
`DOCS_ORIGIN` to the custom-domain pair in both projects (Production and
Preview) before the build that should link to the primary hostnames, then
trigger a new deployment (push to `main` or a dashboard retry). No source change
is required: `scripts/lib/origins.ts` rewrites the authored loopback links to
whatever pair the environment provides.

## Automatic builds

- A push to `main` starts a production deployment of both projects.
- Preview deployments cover all non-production branches and the trigger watches
  the whole repository (`*`); both are editable in the dashboard. Pull requests
  from forks are an exception and may not receive a preview build.
- `.github/workflows/ci.yml` needs no change and no new secret: it stays a
  read-only verifier (`permissions: contents: read`) running `npm ci`,
  `npm run build`, `npm run check` and `npm test`.
- Keep `node_modules/`, `apps/*/out/` and any `.env`/`.dev.vars` file out of
  git, as `.gitignore` already does.

## Preview links and serving behaviour

Preview deployments are built with the same production origin pair, so a preview
links to the stable partner host (`docs.syndroo.com` from a website preview and
`syndroo.com` from a docs preview) rather than an ephemeral preview host. The
origins come from environment variables, so a preview environment could point at
its own host instead; linking two preview projects to each other is not
configured.

The repository ships no `404.html`, `_headers` or `_redirects` file. Per the
serving documentation
(<https://developers.cloudflare.com/pages/configuration/serving-pages/>), Pages
sends `X-Content-Type-Options: nosniff` by default and serves the root document
for unknown paths when a project has no top-level `404.html`. Default edge
caching is used; the local preview server's `cache-control: no-store,
no-transform` (`scripts/lib/static-server.ts`) is a local review setting only. A
custom 404 page or headers added later must keep `npm run check` passing: an
extensionless `_headers` file in the build output currently fails the
publishable-type rule.

## Verified

CI runs `npm ci`, `npm run build`, `npm run check` and `npm test` on every push
with both origins configured, so the deployment gate is the same run a reviewer
can reproduce locally. The documentation fixtures check the real CLI from a
pinned product checkout, so a documented command, flag or candidate version that
the CLI no longer has fails the build instead of reaching a reader.

A successful `npm run build` is a statement about the build, not about what a
host is serving. After a deployment, fetch both custom domains and confirm the
served HTML carries the custom-domain pair with no `localhost:417` reference.

## References

- Build image and `NODE_VERSION`:
  <https://developers.cloudflare.com/pages/configuration/build-image/>
- Serving, headers and unknown-path fallback:
  <https://developers.cloudflare.com/pages/configuration/serving-pages/>
- Git integration:
  <https://developers.cloudflare.com/pages/configuration/git-integration/>
- Custom domains:
  <https://developers.cloudflare.com/pages/configuration/custom-domains/>
