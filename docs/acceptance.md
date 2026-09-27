# Acceptance record

What has actually been run against the current seven-page surface. Routine build
and fixture results are not repeated here: CI runs `npm ci`, `npm run build`,
`npm run check` and `npm test` on every push, and only the results that need
context are recorded.

## Current record

Scope: direct-publishing copy, command examples and browser coverage across the
existing seven pages. No deployment, registry publish or live platform call
formed any part of this work.

Verified:

- `npm run build` exported both sites into their own `out/`.
- `npm run check` reported 0 issues for both exports, and every generated browser
  script parsed.
- `npm test` reported 38 passing tests with no skips, covering the exported
  pages, the shared registry on both sites, the static server behaviour and the
  CLI contract.
- The documentation fixtures compared every documented command, flag and
  candidate version with the real CLI's own `--help` and `version` output, using a
  mode-aware lookup so a `--local` example is checked against the local help.
- The exported surface is the marketing homepage plus the six documentation
  pages, and the two technical 404 documents. No retired route is present in
  either export.
- Both exports were exercised in a browser at 1280x900 and 390x844: all seven
  pages render, navigation and docs search work, and no page overflows its
  viewport.
- The two Playwright cases passed against each app's separate static server.
  They cover cross-site navigation, every docs sidebar entry, inline-input
  search, current-page markers, obsolete-workflow absence and browser errors.
  External requests were blocked; representative desktop/mobile screenshots
  were inspected. This run used Node 26.7.0 on macOS arm64 and Chromium.
- Page fixtures require direct file publishing, inline JSON, optional read-only
  preview, source exclusivity, argv exposure, stdin, credential separation and
  per-action authorization. Separate previews do not reserve a later input.

Not verified:

- Live-account publishing on either platform. Bluesky and Threads still carry an
  explicit pending-acceptance statement.
- The CLI contract fixture needs a built product checkout. It resolves the
  default sibling `../syndroo` or `SYNDROO_CORE_REPO`, so a local run reports a
  skip only when no built checkout is reachable at either path. CI checks one out
  at `292853b21a7535014642bd043610744ed74c3469`, builds it, and then runs
  `node scripts/check-docs-commands.ts` directly, where a missing CLI is a hard
  failure rather than a skip. This pinned product commit contains the verified
  direct-publishing implementation; the local contract passed against that
  same source revision.
- The GitHub Actions result for these changes has not been observed. Local
  verification does not claim a passing remote pipeline.
- Type stripping is not full type checking, and the browser pass is targeted
  acceptance in the stated viewports rather than a universal compatibility claim.
