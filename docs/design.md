# Design contract

The maintained shape of the two sites in this repository. What has actually been
run lives in [acceptance.md](acceptance.md).

## Published surface

Seven public pages and nothing else:

| Site | Paths |
| --- | --- |
| Website | `/` |
| Documentation | `/`, `/accounts/`, `/publishing/`, `/agent-setup/`, `/commands/`, `/faq/` |

Both sites also export the two technical 404 documents Next.js generates. The
registries in `packages/content/site-data.ts` drive the routes, the sitemaps, the
docs search index and the expected build output. The page files themselves create
the Next.js routes; the fixtures enforce the whitelist, so tests reject an
exported page that is not registered and a retired route cannot survive a
rebuild.

## Version facts

| Fact | Value |
| --- | --- |
| CLI candidate the docs describe (`@syndroo/cli`) | `0.6.0-rc.1`, an unpublished release candidate |
| Documentation version | `0.6.0-rc.1`, the same candidate |
| Platform status | Bluesky and Threads supported, live-account acceptance pending |

No page may present the candidate as released, tagged, deployed or installable
from a registry. There is no hosted service, SDK or cloud product to document.

## Deliverable

Two independent static sites, each with its own navigation, styling and build
output, so either serves from its own `out/` without the other. A page can be
opened and refreshed directly: every route is prerendered HTML.

## Content source

`packages/content/site-data.ts` is the single metadata source: the candidate
version, the two platforms, both navigation sets and the page registries. Both
builds compile it into their own output, so the two sites and the fixtures cannot
disagree about the surface.

The authored content stays use-focused: install the CLI, bind one account,
publish directly from a reusable file or inline JSON, optionally preview without
state writes or network, read the receipt, and retry only provably safe targets.
Approval covers exact content and accounts; inline content has argv exposure,
stdin is the alternative, and credentials stay outside post JSON. Separate
invocations read current input; confirmation and sending within one invocation
use the same snapshot. No page describes a hosted API, a published package, a retired version
or a platform feature that has no evidence behind it.

## Composition

The marketing site is one page: an intro with the two hero actions, the three
steps that lead to a publish, the dry-run preview beside the publishing mascot,
a closing call to action, and a footer carrying documentation, source and
licence.

The documentation site renders its topbar, sidebar, footer and search dialog
once in the layout, so a page cannot drift out of the chrome. Each page supplies
its own `main`, its on-page contents and its anchors. The docs search reads only
these local pages, so it can never index a route that is not registered.

## Layout contract

The two sites import one shared stylesheet from `packages/theme`
(`@syndroo/theme/shell.css`) for the shell, the brand mark and the neutral
palette, so neither app can restate them and drift.

| Part | Value |
| --- | --- |
| Shell | `max-width: 1280px`, border-box, centred, gutter `48px` at 1100px and above, `32px` at 720px and above, `20px` below |
| Header row | `72px` on both sites at every width |
| Brand | `26px` logo, `17px`/600 wordmark with a `9px` gap, `16px` wordmark below 720px; identical x position in both headers |
| Website hero | `68px` desktop heading, `34px`-`38px` on phones; body text `17px`, `16px` below 720px |
| Documentation article | `720px` column, `36px` h1, sidebar/article/on-page contents stay responsive |
| Primary action | `#6446ed`, hover `#5334d8`, white label; secondary actions are quiet neutral outlines |

Dark mode remains a full palette swap through `data-theme="dark"`, so surfaces,
borders, text, code panels and status chips all move together.

## Implementation boundary

Authored code is TypeScript, executed or compiled with Node 24 built-in type
stripping. Each app builds a self-contained output directory with its own HTML,
CSS, generated browser JavaScript, generated `robots.txt` and `sitemap.xml`, and
copies of the shared brand assets, excluding sources, configuration and
Markdown. The two sites link to each other by absolute URL through the configured
origin pair.

No runtime external dependency, analytics, email capture, account system or user
data storage is added, and the docs search reads only its own pages.

## Acceptance criteria

- Both apps build from the repository root and independently; `npm run check`
  reports no issues.
- Every registered page exists and nothing else ships; each documentation page
  carries exactly one layout, main region, sidebar, page contents and search
  dialog.
- Every documentation navigation entry resolves, including its fragment; every
  cross-site link resolves inside the other built output.
- Canonical and Open Graph URLs use each page's configured origin; `robots.txt`
  and `sitemap.xml` match the registry and that origin.
- Version claims use only the configured candidate and no page offers an install
  command for an unpublished package.
- Every `syndroo` command and `--flag` the documentation introduces exists in the
  real CLI, checked with a mode-aware `--help` lookup and the CLI's own `version`
  output.
- Live-account publishing is not claimed anywhere: both platforms still carry an
  explicit pending-acceptance statement, and no page presents a publish as
  verified.
