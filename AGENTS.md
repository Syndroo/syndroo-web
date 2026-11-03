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
- Both sites are Next.js App Router projects with a static export. English
  pages live below the `(en)` root route group and keep their existing URLs;
  Chinese pages live below `(zh)` and the public `/zh/` segment. Each language
  has its own root layout so the exported HTML carries `lang="en"` or
  `lang="zh-CN"` before JavaScript runs. Built output lands in `apps/*/out/`
  and is never edited by hand.
- The published surface is one marketing homepage and sixteen documentation
  pages in each language, all held in the locale-aware shared registry. English
  is the default. Adding a page means adding both registry entries and both
  pages; removing one must not leave either route, navigation entry, sitemap
  entry or language counterpart behind.
- Each app builds a self-contained output directory. Shared brand marks come
  from `packages/brand/assets/`; no third-party asset or analytics request is
  added at runtime. The docs search reads only pages in the current language.
- Keep the build reproducible from `npm ci` with no new framework or runtime
  dependency that the task does not require.

## Truthful claims

- `0.7.0` is the published npm release these docs describe. Install the CLI,
  provider SDK, and five official providers at that exact version with the one
  shared command in `packages/content/site-data.ts`. The packaged CLI declares
  `engines.node >= 24.19.0`, and its local writes are POSIX-only: Windows writes
  are refused. Treat registry availability as a release fact to verify before
  rollout; a website build does not prove it.
- An Agent setup prompt must send a local-shell Agent to `npm root --global`
  and then to `@syndroo/cli/skills/syndroo/SKILL.md`. Never invent a separate
  Skill-install command. Server setup keeps GitHub creation and pushes opt-in,
  reuses existing authorization, and keeps secrets out of prompts, arguments,
  logs and tracked files.
- Five local providers publish in the foreground: Bluesky, Threads, LinkedIn,
  and Mastodon take plain text, and DEV.to takes articles. They are
  fixture-tested and still need live-account acceptance, so no page may claim a
  verified publish.
- Each platform page states only what the provider source and the recorded
  provider evidence support. A credential field, an egress origin, a limit or a
  revoke flow that the evidence does not carry is written as **UNRESOLVED** on
  the page instead of asserted. No live social-network call has been made from
  this project, and no page may imply one.
- The single self-hosted Server guide may document the approved user-owned
  Cloudflare deployment slice, Threads connect/publish, and manual GitHub CI.
  Keep generic hosted HTTP API, SDK instructions, internal
  `@syndroo/cloudflare-worker` service details, and earlier-release walkthroughs
  outside this surface. Do not claim live deployment or account acceptance.
- Report only checks that actually ran, and state the limits of the evidence.
- Keep `.github/workflows/ci.yml` pinned to the final reviewed product commit.

## Verification

Run the build, check and test commands from the README for the scope you
touched, and confirm the affected app serves from its own built output. Record
what was verified, at which viewports or inputs, and what remains unverified.
Root reviews the artifacts against these criteria before acceptance.
