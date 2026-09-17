# Design contract

Current contract for the two sites in this repository. It is derived from the
accepted static prototype review record; the acceptance evidence is in
[acceptance.md](acceptance.md).

## Deliverable

Two independent static sites, each with its own navigation, styling and build
output:

- `apps/website` at the marketing origin, default `http://localhost:4173/`
- `apps/docs` at the documentation origin, default `http://localhost:4174/`

The origins are architecture, not a cloud deployment. Both preview servers bind
loopback only and answer `GET` and `HEAD`; requests resolve inside their own
document root, traversal outside it is rejected, and no credentials or
environment files are read. Cross-site links between the two sites are absolute
URLs resolved from the build-time `WEBSITE_ORIGIN` and `DOCS_ORIGIN` values.

The English content is 11 pages: marketing home, blog index, one tutorial,
changelog, about, draft privacy, draft terms; documentation home, quickstart,
API reference and concepts.

## Visual direction

A welcoming engineering tool, not a dashboard: spacious off-white canvas with
ink, muted and thin-border neutrals, violet and blue accents and a pale lavender
support tone. The existing branching logo mark is used unmodified. Type is the
system stack (Avenir Next, Inter, system UI, sans-serif) with a monospace stack
for code. Content is constrained to a 1160px column with 40px desktop and 22px
mobile gutters. Buttons are at least 44px tall, panels use larger radii, shadows
stay restrained, and accent gradients appear only on the logo and short
highlighted phrases.

## Marketing composition

An 80px header carries the symbol and wordmark on the left and Docs, Blog,
Changelog and GitHub on the right, with a keyboard-operable mobile menu. A slim
announcement identifies `0.2.0-rc.1` as an unpublished candidate.

The hero is two columns. The headline reads "Distribution infrastructure for
developers, products and AI agents." at 58-64px desktop and 39-43px mobile,
with the subtitle "Publish to multiple social platforms through one API. Open
source. Self-hosted." The primary action jumps to the demo and the secondary
action opens the documentation origin. A short proof line states Apache-2.0
licensing and the visitor's own Cloudflare account.

The hero visual is the publishing mascot artwork at 300px desktop, 224px at
720px and below and 208px at 360px and below. It is one of exactly three
original mascot artworks, which are used unmodified and never regenerated or
recoloured. The other two appear in the demo and the closing call to action.
No fake dashboard or platform metric is shown.

Below the hero, an understated platform strip uses five local platform marks
with a provenance note and a truthful validation legend, and makes no runtime
third-party request. The interactive demo pairs a dark request panel with a
light result flow under "One request. More places to connect.", offers two
supported cases, and walks a simulated `GET /v1/posts/{id}` excerpt through
queued, publishing and published with per-platform pending, publishing and
published states. The original `POST` 202 queued acceptance receipt stays in a
separate disclosure. Reset, case switching and replay clear stale state, the
two main cards share one stretched row so their edges align, and code copying
uses a local clipboard write with feedback.

The rest of the page keeps shortened prose for scannability: three use cases, an
infrastructure section covering D1, Queues and Cron, an ownership, idempotency
and ambiguous-outcome explanation, a native `details` FAQ and a lavender
closing call to action. The footer carries the Syndroo brand; the legal
attribution `Copyright 2026 Grant Dai` stays in the page bodies and NOTICE.

Blog, changelog, about, privacy and terms complete the marketing site. The blog
index links one tutorial on safe text cross-posting with HTTP, stable
idempotency keys and polling. The changelog lists only local verified candidate
changes. About uses verified product rationale and the real copyright
attribution, with no invented personal history. Privacy and Terms are visibly
marked as drafts pending review, with no invented controller address, analytics
policy, effective date or liability position.

## Documentation composition

The documentation site has its own layout: a sticky topbar with the mark and
`docs`, a search trigger with a shortcut hint, a version selector and links to
the website and repository. The sidebar groups Overview, Get started, API
reference and Concepts with real destinations. The reading column is about
760px wide with in-page contents on desktop, pale lavender active navigation,
and a full-height mobile drawer with a stacked article.

The documentation home offers a first-publishing-workflow headline and three
navigable tiles for quickstart, API reference and how it works, with a clear
candidate notice. The quickstart covers prerequisites, secrets from an example
file, local migrations, the dev server, a health check, an authenticated post
and inspecting results and errors; it warns that copied POST commands against a
configured deployment publish for real, unlike the site demo. The API reference
covers request fields, Bearer auth, the optional idempotency key and its 409
semantics, 202 responses, per-platform overrides, scheduling cadence, the 64 KiB
limit, errors and status responses including ambiguous outcomes. No sidebar
entry points at an empty page.

Search reads the site's own local corpus, opens an accessible modal, filters as
typed, supports native keyboard navigation, closes on Escape and returns focus.
Results show snippets and land on real sections, with a distinct no-results
state. The version selector lists the real `0.2.0-rc.1` candidate and a clearly
marked interaction sample; choosing the sample shows a conspicuous notice that
it is not historical documentation, and no fictitious release history is
implied.

The sticky docs topbar height is measured at runtime into a CSS custom property
so hash targets land fully below the header at each breakpoint. The measured
values recorded during prototype acceptance are 105px at 320px and 65px at
1440px, rising to 218.38px and 109.09px while the version-sample banner is
visible; scroll padding and the sticky sidebar and contents follow that height.

## Implementation boundary

Authored code is TypeScript, executed or compiled with Node 24 built-in type
stripping; no dependency install is required to build. Each app builds a
self-contained output directory with its own HTML, CSS, generated browser
JavaScript and copies of the shared brand assets, excluding sources,
configuration and Markdown. Both local origins expose the shared assets under
`/assets`. All images, code and fonts are local; the generated browser
JavaScript carries a project-relative source URL rather than an absolute path.
Generated JavaScript is a build artifact only. No runtime external dependency,
analytics, email capture, account system or user data storage is added.

## Acceptance criteria

- Both apps build from the repository root and independently, and each serves
  its own built output.
- Every page and cross-site link resolves on the loopback origins; desktop and
  mobile widths show no unintended horizontal overflow at the accepted
  viewports.
- The demo runs end to end with an in-flight guard and reset, code copying
  gives feedback, and search returns real hits, an empty state and Escape
  handling.
- The version sample is clearly marked, navigation and headings match the
  current content, and focus outlines, a skip link, the mobile menu and reduced
  motion all behave.
- All local links and assets resolve, and the shared brand assets are copied
  unmodified.
