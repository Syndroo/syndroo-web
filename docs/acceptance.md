# Acceptance record

This file separates what was accepted for the static prototype from what has
been verified in this repository. The two records are not interchangeable.

## Current migration verification

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
