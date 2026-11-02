# Bilingual Website and Documentation Implementation Plan

> For agentic workers: execute bounded subagent tasks with the user's exact native model and retry limits. Root owns architecture and acceptance; do not subdelegate.

**Goal:** English and Simplified Chinese across both sites; English remains default.
**Architecture:** Keep every existing English URL. Mirror each at `/zh/`, with real statically exported pages and language-specific root layouts. Shared chrome receives locale; links and search stay within it. Language links select the counterpart page without browser-language redirects.
**Tech Stack:** Existing Next.js15.5, MDX, TypeScript, static export, existing shared packages. No new dependencies.
**Spec:** User request on2026-11-03: website and docs both Chinese/English, defaultEnglish. Existing16docs and1homepage must each have a Chinese counterpart; commands/config/protocol values remain exact.

## Global constraints

- Preserve English addresses and content, official provider facts and candidate limitations.
- Emit `lang=en` or `lang=zh-CN` in HTML, not only after JavaScript.
- Chinese navigation, search, copy/menu/theme messages; same-language cross-site links.
- Correct canonical/hreflang/registry/sitemap. No remote translation or analytics service.
- No production deployment or real social action. Reuse current checkout; no unrelated edits.

## Review focus

- Static404 with multiple root layouts must still export and link to valid pages.
- Switching preserves counterpart path and valid section anchors; missing section falls back safely.
- Search reads only current-language pages; Chinese queries find Chinese content.
- English remains default with Chinese browser preferences; no automatic redirect.
- Code/config tokens unchanged in translations; narrow headers remain usable.

## Task A — Chinese documentation content

Own only `apps/docs/app/(zh)/zh/**/page.mdx`. Translate16pages from the immutable task snapshot, retain heading IDs/code, prefix internal document links, add Chinese metadata and English/Chinese alternates. No layout or existing English edits.

- [ ] Translate full content into clear, direct Simplified Chinese.
- [ ] Validate MDX,16counterparts,links,anchors and unchanged command/JSON examples.
- [ ] Report files, checks and unresolved questions.

## Task B — Localized routes, chrome and homepage

Own all other files: locale helpers/registries; route-group layouts; English-page moves and metadata only; Chinese website; headers/footers/theme/search/copy; build audit/fixtures; README/AGENTS.

- [ ] Add focused tests for route pairing, locale HTML, links and locale search.
- [ ] Implement small locale helpers and language links; no new i18n framework.
- [ ] Move English pages under `(en)` without URL changes; root layouts output correct language. Wire Chinese docs owned by A. Keep working404 output.
- [ ] Translate homepage and all shared interaction text, preserving functionality.
- [ ] Update registry/sitemap/metadata/audits and English-specific assertions without weakening cross-locale checks.
- [ ] Run focused tests and report.

## Root acceptance

- [ ] Inspect translations and relevant diffs; verify actual delegation route.
- [ ] Build both sites; check exported links, metadata,language and all34public routes.
- [ ] Run tests against the built current Syndroo candidate, plus production-origin rewrite checks where changed.
- [ ] Verify desktop/mobile language toggle, corresponding docs page, Chinese search, copy and theme; English default.
- [ ] Record limitations and final results. Commit/push only within current authorization; no production deployment.
