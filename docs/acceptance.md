# Acceptance record

What has actually been run against the current seven-page surface. Routine build
and fixture results are not repeated here: CI runs `npm ci`, `npm run build`,
`npm run check` and `npm test` on every push, and only the results that need
context are recorded.

## Current record

Scope: the `0.7.0-rc.1` candidate, three local platforms (Bluesky, Threads and
LinkedIn), the LinkedIn account group and the guided `connect` command. No
deployment, registry publish or live platform call formed any part of this work.

Verified:

- `npm ci --offline` installed the workspace from the local npm cache with exit
  code 0 (228 packages, 0 vulnerabilities).
- `npm run build` exported both sites into their own `out/` with exit code 0.
- `npm run check` reported 0 issues for both exports (website 39 files, 3 pages,
  151 references; docs 55 files, 8 pages, 317 references) and confirmed every
  generated browser script parsed.
- `npm test` reported 38 passing tests, 0 failures and 0 skips with
  `SYNDROO_CORE_REPO=/private/tmp/syndroo-0.7.0-dev`, covering the exported
  pages, the shared registry on both sites, the static server behaviour and the
  CLI contract.
- `node scripts/check-docs-commands.ts` checked all six documentation pages
  against the real `0.7.0-rc.1` CLI binary and reported that every documented
  command, flag and version exists.
- The CLI contract fixture compared every documented command, flag and candidate
  version with the real CLI's own `--help` and `version` output, using a
  mode-aware lookup so a `--local` example is checked against the local help.
- `npx playwright test` ran 46 cases and passed all of them, covering the
  marketing homepage, the six documentation pages, both 404 documents, cross-site
  navigation, docs search, current-page markers, the JSON sample and the
  responsive layout from 320px to 1920px. External requests were blocked. This
  run used Node 26.7.0 on macOS arm64 and Chromium.
- The exported surface is the marketing homepage plus the six documentation
  pages, and the two technical 404 documents. No retired route is present in
  either export.
- The built homepage renders three platform tiles and three footer platform
  links, including `https://www.linkedin.com`; both exports state the
  `0.7.0-rc.1` candidate version.
- Direct product checks: `syndroo connect linkedin --local --json` exited 0 with
  `bindingChanged:false` and `action:"configure_credentials"`;
  `syndroo connect linkedin --managed --json` exited 2 with a `USAGE` error and
  no state change. The LinkedIn provider test `rejects an organization author
  before any network call` asserts `ACCOUNT_MISMATCH` with zero transport calls.
- Page fixtures require direct file publishing, inline JSON, optional read-only
  preview, source exclusivity, argv exposure, stdin, credential separation and
  per-action authorization. Separate previews do not reserve a later input.

Not verified:

- Live-account publishing on any platform. Bluesky, Threads and LinkedIn still
  carry an explicit pending-acceptance statement.
- The CLI contract evidence is local and one-off, not reproducible from this
  repository alone. The fixture resolves the default sibling `../syndroo` or
  `SYNDROO_CORE_REPO`, so a local run reports a skip only when no built checkout
  is reachable at either path. This run used the `0.7.0-rc.1` candidate sources
  at `/private/tmp/syndroo-0.7.0-dev` (base commit `292853b` with an uncommitted
  candidate implementation), so the result cannot be reproduced until product
  0.7.0 is committed and pushed. CI now tracks the product's `main` branch for
  that reason, and its contract can only pass once that commit exists. No remote
  CI pipeline was run and no remote CI result is claimed.
- The GitHub Actions result for these changes has not been observed. Local
  verification does not claim a passing remote pipeline.
- Node.js 22 and Linux were not exercised in this run; the local checks ran on
  Node 26.7.0 on macOS arm64. Windows was not exercised and remains unsupported
  for local writes.
- Type stripping is not full type checking, and the browser pass is targeted
  acceptance in the stated viewports rather than a universal compatibility claim.
