# Design contract

Current contract for the two sites in this repository, at design iteration
`0.4.0`. Evidence for what has actually been run lives in
[acceptance.md](acceptance.md).

## Version vocabulary

Four facts stay separate, and the tests fail if a page mixes them up:

| Fact | Value |
| --- | --- |
| Service candidate (`@syndroo/cloudflare-worker`) | `0.2.0-rc.1`, an unpublished release candidate |
| Client library candidate (`@syndroo/sdk`) | `0.4.0-rc.1`, an unpublished release candidate |
| Terminal command candidate (`@syndroo/cli`) | `0.4.0-rc.1`, an unpublished release candidate |
| Website design iteration | `0.4.0` |
| Documentation version | `0.2.0-rc.1` |
| Platform status | `mock-tested` for Bluesky and Threads, `experimental` for X, Tumblr and LinkedIn |

The design iteration is a change to this repository's website, never a product
release, and no page may present `0.4.0` as a product version. The SDK and CLI
candidates share its `0.4.0` prefix, so the version fixture strips those full
candidate strings before it asks whether a bare `0.4.0` is explained as the
design iteration. A platform's status changes only with a real acceptance
record; a configured instance is a separate fact.

## Deliverable

Two independent static sites, each with its own navigation, styling and build
output:

- `apps/website` at the marketing origin, default `http://localhost:4173/`,
  7 pages
- `apps/docs` at the documentation origin, default `http://localhost:4174/`,
  18 pages

The origins are architecture, not a cloud deployment. Both preview servers bind
loopback only and answer `GET` and `HEAD`; requests resolve inside their own
document root, traversal outside it is rejected, and no credentials or
environment files are read. Cross-site links between the two sites are absolute
URLs resolved from the build-time `WEBSITE_ORIGIN` and `DOCS_ORIGIN` values. Each
build also generates `robots.txt` and `sitemap.xml` from that app's page registry
and the configured origin.

Both sites are Next.js App Router applications with TypeScript and Tailwind CSS,
using shadcn/ui components for the controls that need one, and each one is
statically exported with `output: "export"` into its own `out/`. The docs app
renders MDX pages. There are no Server Actions, no request-time auth and no
dynamic server route, and images do not depend on the default server-side
optimizer, so either export can be served as plain files. The build accepts no
credentials: it refuses to run while a `.env*` or `.dev.vars*` file is present.
The build applies one single-pass origin rewrite to the exported text, so a
custom-origin build never ships loopback links inside its own files.

## Content source

`packages/content/` is the single maintained source for the facts both sites and
the tests need:

- `site-data.ts` — versions, platform capability records (including credentials,
  limits, evidence and official references), agent access methods, the marketing
  and documentation navigation, and the page registries;
- `demo-data.ts` — the four simulated demo scenarios.

Both builds compile these modules into their own output, and the build applies
the same single-pass origin rewrite to generated browser JavaScript as it does to
pages, so a custom-origin build never ships loopback links inside its own bundle.
The modules have no imports and no runtime syntax that type stripping cannot
erase.

Navigation is rendered from the registry by each app's layout: the marketing
header and footer, and the documentation topbar, sidebar, on-page TOC, footer and
search dialog. A fixture test compares every export against the registry, so
drift fails the check. The documentation sidebar marks the current page from the
registry path, and the search index is still built from the same registry at
runtime, so a new page is reachable, marked and searchable without touching the
chrome.

## Visual direction

A welcoming engineering tool, not a dashboard: spacious off-white canvas with
ink, muted and thin-border neutrals, violet `#6446ed` and blue `#267cf8` accents
and a pale lavender support tone. The existing branching logo mark and the three
mascot artworks are used unmodified. Type is the system stack (Avenir Next,
Inter, system UI, sans-serif) with a monospace stack for code. Buttons are at
least 44px tall, panels keep their existing radii, shadows stay restrained, and
the skip link and `:focus-visible` outline stay in place.

The marketing shell has no fixed maximum width: `.wrap` spans the viewport with
`padding-inline: clamp(20px, 3vw, 64px)`, so the header, sections and footer grow
with the window while prose keeps its own `ch`-based measure. The documentation
site uses one shell token for its topbar, layout grid and footer, so all three
share the same left and right boundary at every viewport, and the article column
stays at `78ch`. Code blocks and wide tables scroll inside their own container.

Mascot sizes are per role and set from the change request: 320px in the hero
visual area (220px below 720px) and 200px in the closing call to action (160px
below 720px). The artwork is not cropped: the image itself carries no
`border-radius`, no ancestor hides overflow, and the glow is a separate layer
behind the image. Headings run 58px desktop, 36px at 720px and 32px at 420px;
body text is 17px desktop and 16.5px mobile; code is 13.5px in prose and 13px
inside the demo consoles. Layout uses `min-width: 0` and grid collapse instead of
hiding overflow on `body`, so the only horizontal scrolling is inside a code
block or a wide table.

Theme is a shared semantic-token layer, not a per-page restyle. Both headers
carry the same Light/Dark/System control from `packages/theme/`, `System` is the
default, and the choice moves surfaces, borders, text, status chips, code
consoles, focus rings and the menu together. The pre-paint script reads a
`syndroo-theme` cookie before next-themes runs, so the production pair
(`syndroo.com` and its subdomains) shares one preference across origins without
a first-paint flash; the cookie is written only on those hosts, is scoped with
`Domain=syndroo.com`, and a browser that refuses storage still renders a themed
page. Local and preview origins keep the choice per site.

## Marketing composition

An 80px sticky header carries the symbol and wordmark plus How it works, Agent
setup, Platforms, Docs and GitHub, with a keyboard-operable mobile menu. A slim
chip identifies `0.2.0-rc.1` as an unpublished release candidate.

The hero is two columns. The left side states the task in one short headline
("Publish from your AI agent."), qualifies it as the documented HTTP workflow,
shows a visible readiness boundary (no Syndroo skill, plugin or MCP server
exists, and no platform client has passed live-account acceptance), and offers
two actions: `Set up your agent` to the documentation's agent guide and
`Explore the API` to the API reference. A proof line states self-hosting on the
visitor's Cloudflare account, their own platform credentials and text publishing.

The right side is the single interactive demo, and it is the only place the
marketing site describes the request flow. One scenario object drives both views:

- a scenario picker for a successful publication, a partial failure, an
  ambiguous failure and an idempotent replay;
- an `Agent view` / `API view` switch, where the Agent view shows a conversation
  with per-platform drafts and the API view shows the request, the receipt and the
  status response;
- controls above the conversation, so Pause, Replay, Reset and Copy stay
  reachable while the conversation grows; controls use `aria-disabled` rather
  than `disabled`, so activating one never drops focus;
- an always-visible `Simulated - no posts are sent` marker, a status line, and
  per-platform result rows that pair a glyph with a written state label;
- a boundary note that drafting, preview and confirmation belong to the client,
  not to the API, and a caution line per scenario.

Reduced motion renders the final state without stepping through animations. A
`noscript` message points readers at the agent setup guide and API reference
instead of leaving inert controls on the page. No demo code path performs a
network request, and the tests assert that the generated script contains no
`fetch`, `XMLHttpRequest`, `sendBeacon` or `WebSocket` call.

Below the hero: a platform strip whose five tiles each link to that platform's
guide; an agent entry section that separates the documented HTTP workflow from
the unbuilt skill and out-of-scope MCP server; a `How it works` section that
frames acceptance, delivery, retries and self-hosting, with Cloudflare primitives
in a disclosure; recipe cards; a `Why Syndroo` section; a native `details` FAQ; and
a lavender closing call to action.

Blog, changelog, about, privacy and terms complete the marketing site, with the
same navigation, footer and metadata treatment. Privacy and Terms remain visibly
marked drafts pending operational and legal review, with no invented controller
address, analytics policy, effective date or liability position.

## Documentation composition

The documentation site keeps its own layout: a sticky topbar with the mark and
`docs`, search, a version badge, and links to the website and repository. The
badge replaced the old version selector: there is no historical documentation, so
the page states the version it documents instead of offering a fake choice.

The sidebar groups Start here, Quickstarts, Platform setup, Get an instance,
Recipes, API reference and Concepts, all with real destinations. Only the
unfragmented entry that owns a page carries `aria-current="page"`; chapter
anchors do not claim to be the current page. The reading column stays about 760px
wide with in-page contents on desktop, a pale lavender active state, and a
full-height mobile drawer.

The eighteen pages are: overview, a packages overview, four quickstarts, five
platform guides, three recipes, the HTTP API reference, delivery and guarantees,
Cloudflare deployment and local development. The overview separates getting an
instance from choosing a client, because nothing else works before the first
question is answered; the same split is visible in the navigation, where the
deployment guides sit under `Get an instance` rather than among the quickstarts.

The four quickstarts are the agent-and-Skill path (still at `/agent-setup/`, so
the marketing funnel and every existing link keep resolving), the CLI path, the
SDK path, and the original HTTP path. The first three each install a candidate
tarball, publish one post to one platform, read the result back, and close on the
same `#acceptance` table: accepted, delivered, failed or unknown. The packages
overview states which package deploys and runs the service, which is the client
library, which provides the terminal command, the candidate version of each, the
minimum Node runtime, and that none of them is published. The HTTP API reference
stays complete and is no longer the only starting point; the historical anchors
of the previous quickstart still resolve and point at wherever that step lives
now.

No page tells a reader to install a Syndroo package by name: every install
instruction builds a tarball in a checkout and installs that file, and the CLI is
installed after the SDK so its pinned dependency resolves locally. The
documented `syndroo` commands and flags are checked against the real CLI, so a
drifted option fails the check instead of reaching a reader.

Search indexes the site's own page registry, so a new page is searchable as soon
as it is registered. It opens an accessible modal, filters as typed, supports
native keyboard navigation, closes on Escape and returns focus, shows snippets
and a no-results state, and lands on real sections.

Every page carries a canonical URL, Open Graph title, description and URL, and a
summary card, all built from its own configured origin. `robots.txt` allows
crawling and points at the generated `sitemap.xml`.

## Implementation boundary

Authored code is TypeScript, executed or compiled with Node 24 built-in type
stripping; no dependency install is required to build. Each app builds a
self-contained output directory with its own HTML, CSS, generated browser
JavaScript, generated `robots.txt` and `sitemap.xml`, and copies of the shared
brand assets, excluding sources, configuration and Markdown. `.xml` is part of
the publishable allowlist so the sitemap can be served and audited. Both local
origins expose the shared assets under `/assets`, and generated browser
JavaScript carries a project-relative source URL rather than an absolute path.
No runtime external dependency, analytics, email capture, account system or user
data storage is added, and the Worker's own API surface is unchanged by this
design iteration.

## Acceptance criteria

- Both apps build from the repository root and independently, `npm run check`
  reports no issues, and each preview server serves its own built output.
- Every registered page exists; the marketing navigation and footer match the
  registry on every page; each documentation page carries exactly one layout
  grid, main region, sidebar, page contents and search dialog.
- Every documentation navigation entry resolves, including its fragment; every
  cross-site link resolves inside the other built output, including the hero
  calls to action and the historical quickstart anchors.
- Canonical and Open Graph URLs use each page's configured origin; `robots.txt`
  and `sitemap.xml` match the registry and that origin.
- Version claims use only the configured version facts, no page offers an install
  command for the unpublished package, and no page shows the removed
  `Interaction sample` option.
- Every `syndroo` command, `--flag` and CLI version the documentation introduces
  exists in the real CLI, checked against its own `--help` and `version` output
  by `node scripts/check-docs-commands.ts` and by `tests/docs-commands.test.ts`.
- Each of the three client quickstarts reaches the same `#acceptance` section and
  names all four outcomes, and the packages page states each package's job,
  candidate version and minimum runtime.
- The demo fixtures cover success, partial, ambiguous and replay; a 202 receipt
  is never presented as delivery; an ambiguous publication keeps
  `errorAmbiguous: true` and is never presented as safe to resend; a replay keeps
  the original body and a changed body is a conflict.
- The CI recipe script is exercised against a local stub for a successful
  publication, a partial post whose nested publication statuses differ, HTTP
  errors, unusable input, non-JSON and unusable poll responses, an unreachable
  Worker and poll exhaustion, always without resubmitting.
- Browser-rendered visual, keyboard, zoom and reduced-motion checks at 360, 390,
  768, 1280 and 1440px are **not** part of the recorded evidence: browser access
  was unavailable while this iteration was written. See acceptance.md.
