# Cloudflare Pages deployment

Two Cloudflare Pages projects publish this repository. Both are connected to
`Syndroo/syndroo-web` through the Pages Git integration, build from `main`, and
rebuild automatically when the repository changes. This document records the
dashboard configuration. The repository itself holds no deployment pipeline, no
Wrangler configuration and no credentials.

## Projects

| Setting | `syndroo-web` | `syndroo-docs` |
| --- | --- | --- |
| Repository | `Syndroo/syndroo-web` | `Syndroo/syndroo-web` |
| Production branch | `main` | `main` |
| Root directory | empty (repository root) | empty (repository root) |
| Build command | `npm run build && npm run check && npm test` | `npm run build && npm run check && npm test` |
| Build output directory | `apps/website/dist` | `apps/docs/dist` |
| Dependency install | automatic (`package-lock.json`) | automatic (`package-lock.json`) |
| Public URL | <https://syndroo-web.pages.dev> | <https://syndroo-docs.pages.dev> |

Leave the root directory empty so Pages installs the npm workspace and runs the
root build command from the repository root. Shared build entry points live in
`scripts/` and brand assets in `packages/brand/assets/`.

The build command builds both sites even though each project publishes one of
them. `npm run check` audits `apps/website/dist` and `apps/docs/dist` together
(`scripts/check.ts`), so the focused `npm run build:website` and
`npm run build:docs` scripts leave the other app without output and make the
check fail with `no build output found`. `npm test` then runs the 24 build and
static-server fixtures. Building both in one run is cheap for two small static
sites and keeps the published output gated by the same check and test run.

## Environment variables

Both projects carry the same three plain-text variables, set for Production and
Preview separately:

| Variable | Value |
| --- | --- |
| `WEBSITE_ORIGIN` | `https://syndroo-web.pages.dev` |
| `DOCS_ORIGIN` | `https://syndroo-docs.pages.dev` |
| `NODE_VERSION` | `24` |

Each origin must be a bare http(s) origin: scheme, host and optional port, with
no path, query, fragment or credentials, and the two values must differ. The
build fails with a clear error otherwise (`scripts/lib/origins.ts`).

Neither site links to its own origin: the marketing pages carry 35 absolute
links to the documentation origin and the documentation pages carry 9 links back
to the marketing origin. `DOCS_ORIGIN` therefore shapes the published website
output and `WEBSITE_ORIGIN` shapes the published documentation output, while
both are validated as a pair on every build.

The variables are load-bearing and a missing value fails silently. With them
unset, `npm run build` and `npm run check` both exit 0 while the output ships
loopback links: `scripts/lib/origins.ts` falls back to `http://localhost:4173`
and `http://localhost:4174`, and the audit skips a default that is itself
configured. After changing either project, confirm the published HTML contains
no `localhost:417` reference.

`NODE_VERSION=24` matches `.nvmrc` and the `engines` field. The build image
selects the Node version through `NODE_VERSION` or `.nvmrc`
(<https://developers.cloudflare.com/pages/configuration/build-image/>).

No token, API key, account ID or repository secret is involved. The Git
integration authenticates through its own GitHub App installation, which needs
access to the `Syndroo` organization repository `Syndroo/syndroo-web`; a personal
installation does not cover an organization repository.

## Automatic builds

- A push to `main` starts a production deployment of both projects.
- Preview deployments cover all non-production branches and the trigger watches
  the whole repository (`*`); both are editable in the dashboard. Pull requests
  from forks are an exception and may not receive a preview build.
- `.github/workflows/ci.yml` needs no change and no new secret: it stays a
  read-only verifier (`permissions: contents: read`) running `npm ci`,
  `npm run build`, `npm run check` and `npm test`.
- Keep `node_modules/`, `apps/*/dist/` and any `.env`/`.dev.vars` file out of
  git, as `.gitignore` already does.

## Preview links and serving behaviour

Preview deployments are built with the same production origin pair, so a preview
links to the stable partner host (`syndroo-docs.pages.dev` from a website
preview and `syndroo-web.pages.dev` from a docs preview) rather than an
ephemeral preview host. The origins come from environment variables, so a
preview environment could point at its own host instead; linking two preview
projects to each other is not configured.

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

The documentation project's Cloud build log ran on Node 24.13.1 with a clean
install, built both sites, reported 0 audit issues across 350 local references
and 24 passing tests, uploaded 16 files and finished with a successful
deployment.

The same command chain was run on 2026-09-17 in an isolated copy of `main` at
`90fd6d6` with the production origins: install, build, check and tests all
exited 0, the built HTML contained no loopback link, and two consecutive builds
produced identical output.

The website rebuild also completed successfully using the configured public
origins. Public verification covered all 35 output files across both sites:
every request returned HTTP 200, every response matched the reviewed build
byte for byte, and no page contained a loopback cross-site link. The live demo
reached `published`, documentation search opened the matching API section, and
the website-to-documentation navigation worked.

Unknown paths returned the home document with HTTP 200, confirming the Pages
fallback described above. Requests for `package.json` and `.env` also returned
that same home document; they did not expose those files.

## References

- Build image and `NODE_VERSION`:
  <https://developers.cloudflare.com/pages/configuration/build-image/>
- Serving, headers and unknown-path fallback:
  <https://developers.cloudflare.com/pages/configuration/serving-pages/>
- Git integration:
  <https://developers.cloudflare.com/pages/configuration/git-integration/>
