# Syndroo website and documentation

Sources for the two public sites: the marketing homepage in `apps/website/` and
the documentation in `apps/docs/`. Both are Next.js App Router sites with a
static export, built from the shared metadata in `packages/content/` and the
marks in `packages/brand/assets/`. The product - the `syndroo` CLI, its Worker
and the platform adapters - lives in <https://github.com/Syndroo/syndroo>.

## Pages

Sixteen public pages in the accepted Getting Started / Platforms / Build /
Reference information architecture, plus the two technical 404 documents
Next.js generates:

| Site | Paths |
| --- | --- |
| Website | `/` |
| Docs - Getting Started | `/`, `/getting-started/local-cli/`, `/getting-started/agent/` |
| Docs - Platforms | `/platforms/`, `/platforms/bluesky/`, `/platforms/threads/`, `/platforms/linkedin/`, `/platforms/mastodon/`, `/platforms/devto/` |
| Docs - Build | `/build/provider-plugins/`, `/build/trust-and-registry/` |
| Docs - Reference | `/reference/cli/`, `/reference/configuration/`, `/reference/credentials/`, `/reference/requests/` |

The page registries in `packages/content/site-data.ts` are the single source for
the sitemaps, the docs search and the expected build output, and the fixtures
reject an exported page that is not registered, so a retired route cannot
survive a rebuild.

The v1 IA replaced the earlier `/accounts/`, `/agent-setup/`, `/commands/`,
`/faq/` and `/publishing/` routes. Those page files are deleted rather than
redirected, so an old link reaches the docs 404 page, which points at the four
current sections. The export ships no `_redirects` file and no custom `404.html`
routing, so nothing in the build emits a retired route.

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

`0.7.0-rc.1` is the CLI candidate these docs describe: unpublished, untagged and
undeployed, so the documentation installs a tarball built from the product
repository rather than a package name. Five local providers are wired: Bluesky,
Threads, LinkedIn, and Mastodon for plain text, and DEV.to for articles. They
are fixture-tested rather than live-account accepted, so no page claims a
verified publish. Each platform page states only what the provider source and
the recorded provider evidence support and marks anything else **UNRESOLVED**.
The self-hosted HTTP server, the SDK and the Cloudflare Worker are outside this
public documentation surface.

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
