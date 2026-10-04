# Acceptance record

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
