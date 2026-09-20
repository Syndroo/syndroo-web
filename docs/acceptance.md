# Acceptance record

This file separates what was accepted for the static prototype from what has
been verified in this repository. The two records are not interchangeable, and
the newest record comes first.

## v0.4.0 documentation entry paths (2026-09-20)

Scope: the documentation site in this repository, for CR-040-04 section 7.6. The
docs gained a packages overview and three client quickstarts, the overview now
separates getting an instance from choosing a client, and the agent page became a
quickstart. No deployment, no npm publish, no live platform call and no
credential use formed any part of this work.

Everything documented was read from the candidate packages themselves:
`packages/cli/README.md`, `packages/cli/skills/syndroo/`, `packages/cli/src/help.ts`,
`packages/cli/src/exit-codes.ts`, `packages/sdk/README.md` and `packages/sdk/src/`.

What was executed, and what it produced:

- `npm run build`: both apps exported. Website: 53 files / 9 pages; docs: 87
  files / 20 pages (three new pages: `/packages/`, `/quickstart/cli/`,
  `/quickstart/sdk/`). `robots.txt` and `sitemap.xml` are still generated per app
  from its registry and the configured origin.
- `npm run check`: website 342 local references, 0 issues; docs 1397 local
  references, 0 issues. Every exported `.js` file parsed with `node --check`.
- `npm test`: 45 tests passed, 0 failed. That includes four new fixtures: two
  asserting the packages page states each package's job, version and runtime and
  that every client quickstart ends on the shared `#acceptance` section, and two
  reading the documented CLI surface.
- `node scripts/check-docs-commands.ts`: 18 documented pages checked against the
  real CLI at `../syndroo/packages/cli/dist/bin.js` (CLI `0.4.0-rc.1`), 0 issues.
  Every `syndroo` command, every `--flag` and the documented CLI version was
  compared with the CLI's own `--help` and `version` output. The first run found a
  real false positive - the prose that says the CLI deliberately has no
  `--api-key` flag - so the checker now ignores a flag written after a negation.
  The same fixtures are in `tests/docs-commands.test.ts`, which skips with a
  printed reason when no product checkout is reachable.
- Loopback probes of the exported sites (ports 4173 / 4174): all 18 registered
  docs pages and all 7 registered website pages answered `200`; all 15 docs URLs
  that existed before this change answered `200`; an unknown path answered `404`
  on both origins; the docs `sitemap.xml` listed exactly the 18 registered paths;
  `robots.txt` still pointed at the configured sitemap URL; every registered page
  carried a `main article` with `h2` anchors, which is what the docs search index
  reads; and the ten historical quickstart anchors still resolved.
- The CLI quickstart was executed against a loopback stub, not a real instance:
  `syndroo version`, `skill path`, `doctor`, `posts validate --file post.json`,
  `posts create --file post.json --idempotency-key first-post-001 --json --yes`,
  `posts get post_1 --json`, `posts wait post_1 --timeout 20s`, `posts list
  --limit 5` and `posts create --dry-run`. Exit codes were `0` for each, and the
  create reported `"accepted": true` with `"delivered": false`. An unknown
  subcommand was rejected with a usage message naming the five accepted `posts`
  commands.
- The SDK quickstart code was executed verbatim against the same stub:
  `posts.create` returned `post_1 queued`, `posts.get` printed `published` and the
  Bluesky publication, `posts.list({ limit: 5 })` resolved to an array of one
  summary, and `health()` returned `{"status":"ok"}`.
- Installing the candidates was rehearsed offline. `npm pack --workspace
  @syndroo/sdk` and `npm pack --workspace @syndroo/cli` produce
  `syndroo-sdk-0.4.0-rc.1.tgz` and `syndroo-cli-0.4.0-rc.1.tgz`. In a clean
  directory, `npm install <sdk tarball>` then `npm install <cli tarball>`
  succeeds in 105 ms and 125 ms with no registry access, and `syndroo version`
  and `syndroo skill path` answer from the installed files. Installing the CLI
  tarball alone fails with `ENOTCACHED` / a registry lookup for its pinned
  `@syndroo/sdk@0.4.0-rc.1` dependency, and passing both tarballs to a single
  `npm install` did not stay off the registry either: it stalled on that same
  lookup. The documentation therefore states the SDK-then-CLI order rather than
  leaving it to be discovered.
- Real behaviour found while verifying, and now stated in the SDK quickstart:
  `posts.wait` parks on a timer the runtime may ignore, so a short script whose
  only remaining work is that wait can exit before the deadline. The sample uses a
  single `posts.get` instead and explains when `posts.wait` is appropriate.

Limits recorded by this entry:

- Only the loopback stub was exercised. No deployed instance, no real platform
  account and no npm registry were contacted, and no candidate was published.
- No agent client was evaluated against the Skill; the agent quickstart records
  the workflow and the guardrails, not a client-specific acceptance result.
- The CLI-surface check needs a product checkout. Without one,
  `tests/docs-commands.test.ts` reports a skip, so a CI run of this repository
  alone cannot fail on documentation drift.
- The marketing site still states that no Syndroo skill, plugin or SDK exists, in
  `apps/website/app/page.tsx`. That page was outside this task's write scope, so
  the claim was left untouched and is now stale.

## v0.4.0 framework migration (2026-09-20)

Scope: the website and documentation sources in this repository only, for
CR-040-04..07. Both sites moved to Next.js App Router with a static export; the
brand, content facts, page set and four simulated demo scenarios were carried
over unchanged. No deployment, no publish, no live platform call and no
credential use formed any part of this work.

What was executed, and what it produced:

- `npm ci`, then `npm run build`: both apps exported to their own `out/`.
  Website: 53 files / 9 pages; docs: 78 files / 17 pages. Both exports contain
  no server runtime, and `robots.txt` and `sitemap.xml` are generated per app
  from its registry and the configured origin.
- `npm run check` after that build: website 342 local references, 0 issues;
  docs 1057 local references, 0 issues. Every exported HTML file also passed the
  no-server-dependency markers, and every exported `.js` file parsed with
  `node --check`.
- `npm test`: 41 tests passed, 0 failed (`tests/content.test.ts`,
  `tests/export.test.ts`, `tests/server.test.ts`).
- `WEBSITE_ORIGIN=https://www.syndroo.com DOCS_ORIGIN=https://docs.syndroo.com
  node scripts/build.ts`: completed, and the exported canonical URL, Open Graph
  URL, `robots.txt` sitemap line and `sitemap.xml` all carried the configured
  origins. A scan of both exports found no remaining `localhost:4173` or
  `localhost:4174` reference. The default build was restored afterwards.
- `node scripts/preview.ts` on loopback, then HTTP probes of every registered
  page on both sites: 200 for each page, `404` for an unknown path on both
  origins, and a repeated request for the same page still answered 200.
- Static checks of the exported output: no `src` or `link rel="preconnect"`
  pointing off-origin; only Next.js' shared polyfill chunk matches
  `XMLHttpRequest`, and no app chunk does; the docs search still fetches only
  its own local pages; the marketing demo source and the chunk that carries it
  contain no `fetch`, `XMLHttpRequest`, `sendBeacon` or `WebSocket`.
- `docs/design.md` and `README.md` were updated to describe the new shell rules,
  mascot sizes, shared theme implementation and Next.js build.

Browser acceptance of the exported sites (2026-09-20, headless Chromium):

- The exports were served on loopback and driven through a real rendering
  engine. Measured results: the website shell follows the viewport at
  360/390/768/1280/1440/1920/2560 CSS px with no horizontal overflow; the hero
  mascot renders at 320px desktop and 220px mobile with `border-radius: 0`, an
  absolutely positioned glow layer behind it and zero clipping ancestors; the
  docs header, main and footer edges agree within 0.00px at both 390px and
  1440px across the home, quickstart, API and Bluesky pages; the theme menu is
  reachable by Tab with a visible 2px focus outline, switching to Dark repaints
  the page (`rgb(251,251,254)` to `rgb(14,17,32)`) at 15.91:1 body contrast and
  writes the preference; the reduced-motion context produced no page errors;
  and with JavaScript disabled the home page still renders 5,552 characters of
  text. No off-origin request was observed from either site.
- This host has no Google Chrome, so the recorder used the installed
  Chromium-based Brave in headless mode. The WEB-01..11 checklist is therefore
  only partially satisfied: a `channel: "chrome"` run, Safari, 200% zoom,
  System-theme following and first-paint-flash capture are still outstanding.

Limits recorded by this entry:

- The above is one engine, one pass, and a local static server. First-paint
  flash behaviour, 200% zoom, System-theme following and the Safari smoke test
  are still unexecuted.
- The origin check above is a local build-time check. Nothing was deployed and
  no Cloudflare Pages build was triggered.
- Live platform publishing was not exercised at any point.

## Website design iteration 0.3.0 (2026-09-18)

Scope: the website and documentation sources in this repository, at design
iteration `0.3.0`. The product version is unchanged at `0.2.0-rc.1`, an
unpublished release candidate. No deployment, no publish and no live platform
call formed any part of this work.

What was executed, and what it produced:

- `npm run build` from the repository root: website 23 files / 7 pages; docs 30
  files / 15 pages, including a generated `robots.txt` and `sitemap.xml` per
  site. Both builds completed with no error.
- `npm run check`: website 228 local references and docs 858 local references
  resolved inside their own output, 0 issues for either site, and all five
  generated browser scripts parsed with `node --check` (website: `site.js`,
  `site-data.js`, `demo-data.js`; docs: `doc.js`, `site-data.js`).
- `npm test`: 44 tests passed, 0 failed - `tests/build.test.ts` (12),
  `tests/content.test.ts` (20) and `tests/server.test.ts` (12).
- `WEBSITE_ORIGIN=https://syndroo.com DOCS_ORIGIN=https://docs.syndroo.com npm run
  build` and `npm run check` with the same origins: 0 issues for both sites, no
  loopback origin left anywhere in either output, and canonical URLs, Open Graph
  URLs, `sitemap.xml` and `robots.txt` all carrying those configured origins.
  This is a build-time origin check only; nothing was deployed.
- `tests/content.test.ts` is new. It builds both apps with a custom origin pair
  and checks the shared page registry, the injected documentation chrome
  (exactly one layout grid, main region, sidebar, page contents and search
  dialog per page, one `aria-current` and no leftover markers), the full
  documentation navigation including every fragment, the marketing navigation
  and footer against the registry on all seven pages, canonical and Open Graph
  URLs against each page's configured origin, cross-site links resolved inside
  the other built output (including the hero calls to action and the ten
  historical quickstart anchors), `robots.txt` and `sitemap.xml` against the
  registry, version-claim drift, the absence of the removed version selector and
  of install commands for the unpublished package, the simulated-demo fixture
  contract, and the assertion that the generated demo script contains no
  `fetch`, `XMLHttpRequest`, `sendBeacon` or `WebSocket` call.
- The CI recipe script is extracted from the built documentation page and run
  against a loopback stub, not a real API: a successful publication, a partial
  post whose publication statuses differ from the post status, an HTTP `401`,
  an unusable idempotency key, an invalid poll interval, a hostile error code, an
  unrecognised status value, a non-JSON poll response, a poll response without a
  status, an unreachable Worker and poll exhaustion. It exits with the documented
  codes, keeps its log lines bounded, and never resubmits.
- Root independently ran `tests/build.test.ts` and `tests/content.test.ts`
  (32/32 passing) and `tests/server.test.ts` (12/12 passing) against an isolated
  temporary build output, matching the 44 passing tests above.
- Root independently rebuilt both sites in disposable directories with the
  default loopback origins and with `https://syndroo.com` /
  `https://docs.syndroo.com`. Each pair passed the artifact audit and all five
  generated scripts passed syntax checking. Source hashes confirmed that the
  67 build, application and test files were unchanged after the passing tests.

Implementation used native subagents explicitly assigned to
`opencode-go/deepseek-v4.1-flash`; GPT-6 Astra owned architecture, security review
and final acceptance. No model or provider substitution was made.

What was **not** executed, and may not be claimed:

- No browser-rendered visual check. The 360, 390, 768, 1280 and 1440px viewport
  checks, the keyboard walkthrough, text zoom and the reduced-motion rendering
  were **not** performed: browser access was unavailable while this iteration was
  written, and no alternative automation was used to bypass it. The responsive
  and motion rules were inspected in source only: the structural checks above
  prove that the pages, navigation and generated scripts are consistent, but they
  do not exercise actual viewport behaviour, keyboard order, zoom or
  reduced-motion rendering in a browser.
- No production-origin deployment, no npm publish, no tag and no real platform
  publication. Platform statuses remain `mock-tested` (Bluesky, Threads) and
  `experimental` (X, Tumblr, LinkedIn); no live-account acceptance record exists.
- The documentation deployment steps are recorded from the product repository
  and were not executed.
- Official platform documentation was checked where retrievable. The Bluesky
  app-password page and X's app-permission naming page could not be read in this
  environment; those setup details retain the candidate repository's recorded
  requirements and still need a provider-side check before live acceptance.

Environment limits worth recording: loopback binding is blocked inside the
agent's default sandbox, so the fixture suites (and the CI recipe stub) were run
with an approved escalation; the production-origin build is a separate check.

## Earlier record: static prototype migration (2026-09-17)

Accepted locally on 2026-09-17 by GPT-6 Astra. Production deployment and real
publishing were not performed. The GitHub workflow is configured; its remote
execution is not included in this local acceptance.

- Root ran `npm ci --no-audit --no-fund`, `npm run build`, `npm run check`, and
  `npm test` from a clean workspace. All passed: website 19 files / 7 pages /
  197 references, docs 16 files / 4 pages / 153 references, zero audit issues,
  and 24 passing tests. Both generated browser scripts passed syntax checking.
- Independent `build:website` and `build:docs` commands passed. Root built both
  sites with `WEBSITE_ORIGIN=https://www.example.com` and
  `DOCS_ORIGIN=https://docs.example.com`; the custom-origin artifact checks also
  passed, preserving Worker sample URLs. These are example hosts, not approved
  production domains.
- Root compared all 11 HTML pages, both stylesheets, both browser TypeScript
  files, ten shared images/icons, and LICENSE/NOTICE against the accepted
  inputs: 27 exact byte matches. Generated scripts preserve client logic with
  only their served `sourceURL` changed.
- The test fixtures exercised invalid and colliding origins, one-pass origin
  rewriting, separate app output, config/source/map exclusion, hidden trees,
  symlinked build roots, missing references/fragments, and malformed artifacts.
- Local server fixtures exercised GET/HEAD, method rejection, directory
  redirects, traversal, malformed encoding, NUL and backslash paths, source
  exclusion, symlink escapes, hidden aliases, symlinked document roots,
  protocol-relative paths, loopback binding, and partial-startup cleanup. Root
  additionally checked a directory-index symlink into a hidden subtree: 404,
  with none of the disposable hidden marker served.
- Root ran the new `npm run preview` output in the sanctioned in-app browser.
  Homepage and docs measured 1425/1425 at a 1440px viewport and 305/305 at 320px,
  with no horizontal document overflow. Three original mascots loaded at equal
  300px desktop / 208px narrow sizes; the closing mascot retains lazy loading.
- Actual Run reached published for Threads and Bluesky while the original POST
  202 receipt stayed queued; Reset returned Ready. The mobile menu opened and
  navigated to the independent docs origin. Search for `BODY_TOO_LARGE` found
  Errors, and ArrowDown/Enter navigated to `/api/#errors`.
- The mobile docs version-sample banner and drawer worked. Clicking Create a
  post closed the drawer and settled the heading at 242.59px below the
  218.38px header. At 1440px the sample header and sidebar aligned at 109.09px.
  Website navigation returned to the marketing origin. Browser error logs were
  empty. Temporary preview processes, browser tab and viewport override were
  cleaned up after these focused migration checks.

Implementation used the explicitly selected native fixed route
`opencode-go/deepseek-v4.1-flash`, with Astra reviewing and accepting it. The
implementation completed on attempt 1. The documentation task produced partial
files before an upstream protocol error; a fresh, smaller task on the same
route completed on attempt 2. No provider or model substitution occurred.

The reference scanner targets quoted HTML attributes and CSS `url()` as used
by these sources; it is not a general HTML parser. Type stripping and syntax
checks do not provide full TypeScript type checking. The focused migration
browser checks above complement the broader prototype acceptance below.

## Prior prototype acceptance

Source: the accepted static prototype review record for the design contract in
[design.md](design.md). Prototype acceptance ran 2026-09-16 and 2026-09-17, with
design and acceptance owned by GPT-6 Astra. That record describes the prototype
deliverable, not this repository's workspace layout.

Scope of the accepted record:

- 11 English pages reviewed at 320px and 1440px in the sanctioned in-app
  browser, with the homepage and documentation interactions also checked at
  390px and an earlier homepage pass at 1280px. Desktop document width measured
  1425px and narrow width 305px.
- Navigation, the mobile marketing menu, the FAQ disclosure, copy actions, the
  skip link and cross-origin links between the marketing and documentation
  origins were exercised.
- Documentation search was exercised for a real error term, arrow and Enter
  result navigation, same-page result closing with focus on the destination
  heading, the no-results state, modal focus wrapping and Escape, and the
  version-sample notice. Measured anchor offsets were 105px at 320px and 65px
  at 1440px, rising to 218.38px and 109.09px with the version-sample banner,
  with headings settling fully below the header.
- The simulated demo reached published on both demo cases and all steps,
  retained the queued `POST` 202 receipt, and cleared state on reset, case
  switching and replay. The three mascot artworks were 300px square and equal
  on desktop and scaled at narrow widths; the demo cards stayed aligned.
- Both tutorial tables scroll locally at narrow widths, keeping the 320px
  document within its viewport, and fit their containers at 1440px.
- Static reference scans covered the 11 pages and their local HTML and CSS
  references with no missing targets or fragments, and the two generated
  browser scripts passed syntax checks.

Limits recorded by that acceptance, which still apply:

- Type stripping is not full type checking.
- Live platform publishing was never exercised. Threads, Bluesky, X, Tumblr and
  LinkedIn have not been tested against live accounts.
- Privacy and Terms are unapproved drafts and the maintainer biography is
  absent pending verified input.
- The record is targeted acceptance in the stated browser and viewports, not a
  security audit or a universal compatibility claim.
