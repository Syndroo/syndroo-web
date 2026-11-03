# Syndroo website and documentation

Sources for the two public sites: the marketing homepage in `apps/website/` and
the documentation in `apps/docs/`. Both are Next.js App Router sites with a
static export, built from the shared metadata in `packages/content/` and the
marks in `packages/brand/assets/`. The product - the `syndroo` CLI, its Worker
and the platform adapters - lives in <https://github.com/Syndroo/syndroo>.

## Pages

Thirty-four public pages: English and Simplified Chinese counterparts for the
marketing home and sixteen documentation pages, plus the two technical 404
documents Next.js generates. English keeps the existing paths and is the
default; the Chinese site mirrors each page under `/zh/`.

| Site | English | Simplified Chinese |
| --- | --- | --- |
| Website | `/` | `/zh/` |
| Docs - Getting Started | `/`, `/getting-started/local-cli/`, `/getting-started/server/`, `/getting-started/agent/` | `/zh/`, `/zh/getting-started/local-cli/`, `/zh/getting-started/server/`, `/zh/getting-started/agent/` |
| Docs - Platforms | `/platforms/`, `/platforms/bluesky/`, `/platforms/threads/`, `/platforms/linkedin/`, `/platforms/mastodon/`, `/platforms/devto/` | `/zh/platforms/`, `/zh/platforms/bluesky/`, `/zh/platforms/threads/`, `/zh/platforms/linkedin/`, `/zh/platforms/mastodon/`, `/zh/platforms/devto/` |
| Docs - Build | `/build/provider-plugins/`, `/build/trust-and-registry/` | `/zh/build/provider-plugins/`, `/zh/build/trust-and-registry/` |
| Docs - Reference | `/reference/cli/`, `/reference/configuration/`, `/reference/credentials/`, `/reference/requests/` | `/zh/reference/cli/`, `/zh/reference/configuration/`, `/zh/reference/credentials/`, `/zh/reference/requests/` |

The locale-aware page registries in `packages/content/site-data.ts` are the
single source for navigation, sitemaps, docs search and expected build output.
Fixtures reject an exported page that is not registered. Search indexes one
language at a time, and a manual language link selects the corresponding page
without reading a browser locale or storing a language preference.

The v1 IA replaced the earlier `/accounts/`, `/agent-setup/`, `/commands/`,
`/faq/` and `/publishing/` routes. Those page files are deleted rather than
redirected, so an old link reaches the docs 404 page, which points at the four
current sections. The export ships no `_redirects` file or redirect entry for a
retired route; unknown addresses resolve to the generated static 404 document.

## Setup

Node.js 24 or newer and npm. Run everything from the repository root:

```bash
npm ci           # install workspace dependencies
npm run build    # static export of both sites into apps/*/out
npm run check    # verify built artifacts, links and configured origins
npm test         # run the Node fixtures (after a build)
npm run dev      # both Next.js development servers
npm run preview  # serve the existing export on loopback
```

`tests/docs-commands.test.ts` compares every documented command and flag with
the real CLI, so it needs a built product checkout. It resolves the default
sibling `../syndroo` or `SYNDROO_CORE_REPO`; build that repository first
(`npm ci && npm run build`). With no built checkout at either path it reports a
skip and the rest of the suite still runs. CI builds one and then runs
`node scripts/check-docs-commands.ts`, where a missing CLI is a hard failure.

## Build-time origins

The sites link to each other by absolute URL, so every build needs both origins.
The authored sources keep `http://localhost:4173` and `http://localhost:4174`;
the build rewrites them to whatever pair the environment provides.

```bash
WEBSITE_ORIGIN=https://syndroo.com DOCS_ORIGIN=https://docs.syndroo.com npm run build
```

Each value must be a plain HTTP(S) origin - scheme, host, optional port - with no
path, query, fragment or credentials, and the two must differ.

Hosting configuration is recorded in
[docs/cloudflare-pages.md](docs/cloudflare-pages.md). Built output is generated:
change the source and rebuild instead of editing `apps/*/out`.

## Content status

`0.7.0` is the npm release these docs describe. The default install is
one command containing `@syndroo/cli`, `@syndroo/provider-sdk`, and the five
official provider packages, all pinned to `0.7.0`. Supported local writes need
Node.js 24.19.0 or newer on macOS or Linux. Readers do not clone or build the
product repository; source builds remain a contributor path.

Five local providers are wired: Bluesky, Threads, LinkedIn, and Mastodon for
plain text, and DEV.to for articles. They are fixture-tested rather than
live-account accepted, so no page claims a verified publish. Each platform page
states only what the provider source and the recorded provider evidence support
and marks anything else **UNRESOLVED**.
The approved self-hosted slice deploys to the reader's Cloudflare account and
uses Threads connect/publish plus manual GitHub CI. It has not been accepted
with live Meta, Cloudflare or GitHub accounts. The generic hosted HTTP API, SDK
and earlier-release walkthroughs remain outside this public surface.

The product checkout in `.github/workflows/ci.yml` is pinned to
`c656b5ec999bb8363e0f63451df492b825d4ba2f`. ROOT verifies the seven public
packages from a clean npm prefix before rollout.

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
