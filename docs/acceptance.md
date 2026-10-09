# Acceptance record

What was actually run against the sources in this repository, newest first. Each
entry records the exports it inspected and the limits of that evidence.

## 2026-10-09 - architecture v1 information architecture

Rebuilt the documentation site into the accepted Getting Started / Platforms /
Build / Reference structure, against the same unpublished `0.7.0-rc.1` candidate
at product commit `f961d8d14c088276c919a70f3dfb0031a0ac47f4` (the product
checkout was read only; no product file was changed).

## Scope

The docs app went from five flat pages to fifteen: a getting-started flow
(overview, local CLI, agent), a Platforms section with one guide per official
provider plus an index, a Build section (provider plugins, trust and registry)
and a Reference section (CLI, configuration, credentials, requests and
envelopes). The five earlier routes (`/accounts/`, `/agent-setup/`,
`/commands/`, `/faq/`, `/publishing/`) were deleted; navigation, sitemap,
robots, the docs search, the 404 document and the repository docs were updated
to the new surface. The marketing page kept its design, gained links from its
platform cards to the matching guides, and had its `post.json` sample corrected
to the protocol's `content.text` shape.

## Verified

- `npm run build` exported both apps independently and completed the Next.js
  compilation and type checks.
- `npm run check` reported `0 issue(s)` for both exports: 39 files / 3 pages for
  the website and 82 files / 17 pages for the docs, covering local links,
fragments, ids, assets, configured origins and generated browser scripts.
- `npm test` passed all 38 Node fixtures with no skips, including
  `tests/docs-commands.test.ts`, which read the exported docs and ran the real
  built CLI's `--help` for `connect`, `publish` and `status`, probed every global
  flag and compared `--version` with the documented candidate.
- `npm run build:website` and `npm run build:docs` each exited 0 on their own.
- All 46 Playwright cases passed in Chromium (30.9s), including the smoke test
  that visits every registered docs page at 1280px and 390px, the docs search,
  the narrow-viewport drawers, and the homepage JSON sample. The earlier run of
  this change failed on two real defects - MDX wrapped multi-line block elements
  in an extra `<p>`, which produced a React hydration mismatch on every docs
  page, and the homepage sample used a string `content` the protocol does not
  accept - both are fixed, and the final run has no page errors.
- `rg -n 'syndroo (doctor|posts|skill|local)\b'` over the sources and over
  `apps/docs/out` plus `apps/website/out` returned no match in either place
  (exit 1), and no exported file links to one of the five deleted routes.

## Limits and known product differences

- No live social-network call has been made from this project. Every platform
  guide is written from the provider source in the product checkout
  (`packages/provider-*/src/index.ts`) and the recorded provider API evidence
  retrieved on 2026-10-08, and states **UNRESOLVED** where that evidence does not
  carry a claim: Bluesky's app password settings path, the Threads host suffix /
  text limit / error table / revoke flow, LinkedIn's commentary limit / error
  format / token revocation, Mastodon's full error entity and per-instance
  limits, DEV.to's key issuance and rate limits, and the packaged Skill workflow.
  The browser-callback connection step is now completed by the local CLI
  (`--redirect-uri` with a controlling terminal, or `--callback-url -` on
  standard input), and that path is verified by fixture tests against local HTTP
  servers only; no live account was connected for it.
- The self-hosted HTTP server, the SDK and the Cloudflare Worker stay outside the
  documented surface; the docs overview marks them unresolved.
- The CLI contract check reads help and version only. It does not execute OAuth,
  publishing, migration or recovery, and it does not prove platform acceptance.
- No deployment, registry publication or live platform request formed part of
  this work, and no passing GitHub Actions result is claimed for it.

Environment: macOS arm64, Node.js 24.19.0, installed workspace dependencies and
Chromium. Build origins were `http://localhost:4173` and
`http://localhost:4174`; the two Pages projects were not exercised.

## 2026-10-04 - seven-page site

Local verification of the seven-page site on 2026-10-04, documenting the
unpublished CLI `0.7.0-rc.1` candidate at product commit
`f961d8d14c088276c919a70f3dfb0031a0ac47f4`.

## Scope

Updated the six guides and matching homepage, metadata and repository facts for
five local providers: Bluesky and Threads text, LinkedIn personal text, Mastodon
public text, and DEV.to public personal articles. The guides cover explicit
credential sources, local Mastodon OAuth, DEV.to document format 2, explicit
state upgrade, same-machine agent execution, and safe retry behavior. Existing
page routes, provider anchors and the responsive design were preserved.

No deployment, registry publication or live platform request formed part of
this work. The product checkout was read for command and input contracts; this
website task did not modify product code.

## Verified

- `npm run build` exported both apps independently and completed the Next.js
  compilation and type checks.
- `npm run check` reported zero issues in both exports. Local links, fragments,
  IDs, assets, configured origins and generated browser scripts passed.
- `npm test` passed all 38 tests with no skips. The real built product CLI was
  available, so command, flag, local-mode and candidate-version checks executed.
- The product revision above is now pinned in the website CI workflow. The
  command checker exercised only help and version; it did not execute the
  publishing or authorization examples.
- Nine rendered JSON blocks parsed successfully. Six publishing examples,
  including inline JSON and the DEV.to article, also passed the product's actual
  document parser. Credential placeholders were parsed as JSON, not used to
  authorize accounts.
- All 46 existing Playwright cases passed in Chromium. The homepage was checked
  across widths from 320 to 1920 pixels, and every documentation page across
  widths from 320 to 1440 pixels. The suite covered navigation, local search,
  drawers, themes, layout bounds, browser errors and the homepage JSON example.
- Both apps were served from their own static output directories on loopback.
  Third-party browser requests were blocked. Desktop and mobile screenshots,
  including the five-provider cards, were reviewed.
- The documentation retains source exclusivity, one input read per publish,
  optional read-only preview, explicit authorization, no blind resend of unknown
  results, and retry timing and attempt limits. A separate preview does not
  reserve the input of a later publish.
- `git diff --check` passed. No dependencies or test expectations were changed.

Environment: macOS arm64, Node.js 26.7.0, installed workspace dependencies and
Chromium. Build origins were `http://localhost:4173` and
`http://localhost:4174`; production-origin deployment was not exercised.

## Limits and known product differences

- All five providers still need live-account acceptance. The full packaged
  platform locality gate and complete OS/Node matrix are not established by
  website checks. Fixture-tested is not a verified real publish.
- The product's general help tagline still names only three providers. Legacy
  `auth set --local --help` lists `--save-credential-file` in its options but not
  in its usage line. These product help inconsistencies remain outside this
  website edit; the guides use the current `connect` command for saving files.
- The CLI contract check compares documented commands and flags with actual
  help output; it does not execute OAuth, publishing, migration or recovery.
  JSON parsing likewise does not prove platform acceptance.
- No passing GitHub Actions result is claimed for these local website changes.
  Browser checks cover the stated inputs and viewports, not every browser or
  operating system.
