# Agent guide

## Roles

- GPT-6 Astra is the root model and owns architecture, security decisions,
  design ownership and final acceptance.
- Delegate bounded implementation, debugging, research organization and data
  processing to the exact fixed role `opencode-go/deepseek-v4.1-flash`. Confirm
  the tool schema accepts that exact model ID before spawning. Never substitute
  another provider or model, and never present root-model work as delegated.
- Keep at most two subagents active, and allow at most three attempts per
  subtask, counting the initial attempt. Retry only after changing the approach,
  correcting the input or observing a relevant environment change. Do not
  retry authentication, permission, quota or model-availability failures.
  A wait timeout is not a failed attempt: inspect the existing child first.
- Parallel subtasks must be independent and must not share file ownership.
- Each delegation states its goal, allowed files, constraints, inputs, expected
  output, verification method and acceptance criteria. Results must identify
  changed files, verification evidence and unresolved issues. Release finished
  children through the supported lifecycle operation.

## Scope

- This repository holds the website and documentation sources only. The product
  code, CLI, Worker, migrations and platform adapters live in
  <https://github.com/Syndroo/syndroo>.
- Carry authorized repository work through to completion. Require explicit
  authorization for production deployment, real platform publishing, external
  messages and destructive remote changes.
- Routine repository work that the task already authorizes, including commits
  and pushes to the repository under review, proceeds without a separate
  approval step.
- Never commit credentials, tokens, `.env` or `.dev.vars` files, account
  resource IDs, tunnel URLs or private review logs.

## Source conventions

- TypeScript for all repository-owned executable code and tests, executed or
  compiled by Node 24 built-in type stripping. Keep syntax erasable, and import
  sibling sources with their real `.ts` extension, as `scripts/` does.
- Both sites are Next.js App Router projects with a static export. Pages are
  `apps/website/app/page.tsx` and the MDX files in `apps/docs/app/**/page.mdx`,
  with each app's stylesheet and browser TypeScript under its `app/`,
  `components/` and `src/`. Built output lands in `apps/*/out/` and is never
  edited by hand.
- The published surface is fixed and small: the marketing homepage plus the six
  documentation pages in the shared registry. Adding a page means adding one
  registry entry in `packages/content/site-data.ts` and one page; removing one
  must not leave the old route in the export.
- Each app builds a self-contained output directory. Shared brand marks come
  from `packages/brand/assets/`; no third-party asset or analytics request is
  added at runtime, and the docs search reads only its own local pages.
- Keep the build reproducible from `npm ci` with no new framework or runtime
  dependency that the task does not require.

## Truthful claims

- `0.6.0-rc.1` is the CLI candidate these docs describe. It is an unpublished
  candidate: do not describe it as released, tagged, deployed or installable from
  a registry.
- Bluesky and Threads are the two supported platforms, and both still need
  live-account acceptance, so no page may claim a verified publish.
- Do not reintroduce retired surfaces: the hosted HTTP API, the SDK, the
  `@syndroo/cloudflare-worker` service, or any earlier version.
- Report only checks that actually ran, and state the limits of the evidence.

## Verification

Run the build, check and test commands from the README for the scope you
touched, and confirm the affected app serves from its own built output. Record
what was verified, at which viewports or inputs, and what remains unverified.
Root reviews the artifacts against these criteria before acceptance.
