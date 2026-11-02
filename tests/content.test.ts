// Content fixtures for the published surfaces.
//
// Everything here reads both language variants of the built output: two
// marketing homes, thirty-two documentation pages and the technical 404
// documents. It covers navigation, metadata, generated files, theme controls
// and same-language cross-site links.
//
// These fixtures read the built output as it was produced, so they cover the
// configured origin pair as well as the content: the pair is resolved from the
// environment the build ran with, and a build configured for another pair is
// checked against that pair instead of being rebased inside the fixture.
// Nothing here contacts a platform, a registry or any network service.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test, { before } from "node:test";

import { SITE_TARGETS } from "../scripts/lib/app-targets.ts";
import { listFiles } from "../scripts/lib/files.ts";
import {
  DEFAULT_DOCS_ORIGIN,
  DEFAULT_WEBSITE_ORIGIN,
  resolveOrigins,
  type Origins,
} from "../scripts/lib/origins.ts";
import { repoRoot } from "../scripts/lib/paths.ts";
import {
  ORIGIN_PLACEHOLDERS,
  PUBLIC_NODE_RUNTIME,
  docsNav,
  docsNavZh,
  docsPages,
  docsPagesEn,
  docsPagesZh,
  footerNav,
  footerNavZh,
  platforms,
  primaryNav,
  primaryNavZh,
  versions,
  websitePages,
  websitePagesEn,
  websitePagesZh,
} from "../packages/content/site-data.ts";

/**
 * The origin pair the built output was produced with. The fixtures read the
 * export a build already rewrote, so they follow the environment the build ran
 * with instead of rewriting the artifacts they are verifying.
 */
const BUILT: Origins = resolveOrigins(process.env);

/** The loopback defaults output built for another pair must not leak. */
const LOOPBACK_DEFAULTS = [DEFAULT_WEBSITE_ORIGIN, DEFAULT_DOCS_ORIGIN].filter(
  (origin) => origin !== BUILT.website && origin !== BUILT.docs,
);

/**
 * The thirty-four public pages, in the order the sites publish them. A page that is
 * not in this list does not exist, so a retired route cannot quietly survive in
 * the export.
 */
const PUBLIC_PAGES = [
  ...websitePages.map((page) => `website ${page.path}`),
  ...docsPages.map((page) => `docs ${page.path}`),
];

/** Pages Next.js generates for a static export; they carry no marketing copy. */
const TECHNICAL_FILES = ["404.html", "404/index.html"];

let websiteDist = "";
let docsDist = "";

before(async () => {
  for (const site of SITE_TARGETS) {
    if ((await listFiles(site.outRoot)).length === 0) {
      throw new Error(`${site.name} has no export at ${site.outRoot}; run \`npm run build\` before \`npm test\``);
    }
  }
  [websiteDist, docsDist] = SITE_TARGETS.map((site) => site.outRoot);
});

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

/**
 * A built file may keep a loopback default only when that origin is one of the
 * origins it was built for; otherwise it is a leak from the authored sources.
 */
function assertNoLoopback(text: string, label: string): void {
  for (const origin of LOOPBACK_DEFAULTS) {
    assert.ok(!text.includes(origin), `${label} must not leak the loopback origin ${origin}`);
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function idsOf(html: string): Set<string> {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
}

/** Rendered prose with the RSC payload and stylesheets removed. */
function authoredText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, ""),
  );
}

function navLinks(html: string): { label: string; href: string }[] {
  const block = /<nav class="site-nav" id="site-nav"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? "";
  return [...block.matchAll(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g)].map((match) => ({
    href: match[1],
    label: match[2],
  }));
}

function footerLinks(html: string): { label: string; href: string }[] {
  const footer = /<footer class="site-footer">([\s\S]*?)<\/footer>/.exec(html)?.[1] ?? "";
  return [...footer.matchAll(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g)].map((match) => ({
    href: match[1],
    label: decodeEntities(match[2]),
  }));
}

function docsSidebarLinks(html: string): string[] {
  const block = /<aside class="sidebar"[^>]*id="docs-sidebar"[^>]*>([\s\S]*?)<\/aside>/.exec(html)?.[1] ?? "";
  return [...block.matchAll(/<a[^>]*href="([^"]+)"/g)].map((match) => match[1]);
}

/** Every href in the page that points at the other site's configured origin. */
function crossSiteHrefs(html: string, origin: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href === origin || href.startsWith(`${origin}/`));
}

/** Map an absolute cross-site URL onto the other app's built file and fragment. */
function resolveBuiltTarget(
  href: string,
  registry: { file: string; path: string }[],
): { file: string; fragment: string } {
  const withoutOrigin = href.replace(/^https?:\/\/[^/]+/, "");
  const hashIndex = withoutOrigin.indexOf("#");
  const path = hashIndex === -1 ? withoutOrigin : withoutOrigin.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : withoutOrigin.slice(hashIndex + 1);
  const entry = registry.find((page) => page.path === path);
  assert.ok(entry, `${href} should match a registered page (got ${path})`);
  return { file: entry.file, fragment };
}

/** Map an authored placeholder link onto the origin pair the build used. */
function expectedWithOrigins(href: string): string {
  for (const [placeholder, origin] of [
    [ORIGIN_PLACEHOLDERS.docs, BUILT.docs],
    [ORIGIN_PLACEHOLDERS.website, BUILT.website],
  ] as const) {
    if (href === placeholder || href.startsWith(`${placeholder}/`)) {
      return origin + href.slice(placeholder.length);
    }
  }
  return href;
}

async function docsPage(file: string): Promise<string> {
  return readFile(join(docsDist, file), "utf8");
}

async function websitePage(file: string): Promise<string> {
  return readFile(join(websiteDist, file), "utf8");
}

test("the shared page registry matches the built output and nothing else ships", async () => {
  for (const [label, dist, registry] of [
    ["website", websiteDist, websitePages],
    ["docs", docsDist, docsPages],
  ] as const) {
    for (const page of registry) {
      const html = await readFile(join(dist, page.file), "utf8");
      // Next.js emits the doctype in upper case.
      assert.match(html, /^<!doctype html>/i, `${label} ${page.file} should be a page`);
      assert.equal(countOccurrences(html, '<link rel="canonical"'), 1, `${label} ${page.file} canonical`);
    }

    // Every exported page is either registered or one of the two technical 404
    // documents, so a retired route cannot linger in the output.
    const exported = (await listFiles(dist))
      .map((file) => file.slice(dist.length + 1))
      .filter((file) => file.endsWith(".html"));
    const allowed = new Set([...registry.map((page) => page.file), ...TECHNICAL_FILES]);

    for (const file of exported) {
      assert.ok(allowed.has(file), `${label} export contains ${file}, which is not a registered page`);
    }
    assert.equal(
      exported.length,
      allowed.size,
      `${label} export should hold exactly the registered pages and the 404 documents`,
    );
  }
});

test("technical 404 language switches return to public language homes", async () => {
  for (const [label, dist] of [
    ["website", websiteDist],
    ["docs", docsDist],
  ] as const) {
    for (const file of TECHNICAL_FILES) {
      const html = await readFile(join(dist, file), "utf8");
      const languageTags = [...html.matchAll(/<a\b[^>]*\bdata-language-switch="zh"[^>]*>/g)];
      const hrefs = languageTags.map(
        (match) => /\bhref="([^"]+)"/.exec(match[0])?.[1] ?? "",
      );

      assert.deepEqual(hrefs, ["/zh/", "/zh/"], `${label} ${file} language switches`);
      assert.ok(
        !html.includes('href="/zh/_not-found/"'),
        `${label} ${file} must not expose the internal not-found path`,
      );
    }
  }
});

test("the published surfaces are exactly the two bilingual sites readers were promised", () => {
  assert.deepEqual(PUBLIC_PAGES, [
    "website /",
    "website /zh/",
    "docs /",
    "docs /getting-started/local-cli/",
    "docs /getting-started/server/",
    "docs /getting-started/agent/",
    "docs /platforms/",
    "docs /platforms/bluesky/",
    "docs /platforms/threads/",
    "docs /platforms/linkedin/",
    "docs /platforms/mastodon/",
    "docs /platforms/devto/",
    "docs /build/provider-plugins/",
    "docs /build/trust-and-registry/",
    "docs /reference/cli/",
    "docs /reference/configuration/",
    "docs /reference/credentials/",
    "docs /reference/requests/",
    "docs /zh/",
    "docs /zh/getting-started/local-cli/",
    "docs /zh/getting-started/server/",
    "docs /zh/getting-started/agent/",
    "docs /zh/platforms/",
    "docs /zh/platforms/bluesky/",
    "docs /zh/platforms/threads/",
    "docs /zh/platforms/linkedin/",
    "docs /zh/platforms/mastodon/",
    "docs /zh/platforms/devto/",
    "docs /zh/build/provider-plugins/",
    "docs /zh/build/trust-and-registry/",
    "docs /zh/reference/cli/",
    "docs /zh/reference/configuration/",
    "docs /zh/reference/credentials/",
    "docs /zh/reference/requests/",
  ]);
  assert.equal(PUBLIC_PAGES.length, 34, "the public surface is thirty-four pages");
  assert.equal(websitePages.length, 2, "the marketing site has one page in each language");
  assert.equal(docsPages.length, 32, "the documentation site has sixteen pages in each language");
  assert.deepEqual(websitePagesEn.map((page) => page.path), ["/"]);
  assert.deepEqual(websitePagesZh.map((page) => page.path), ["/zh/"]);
});

test("every docs page carries one layout, main, sidebar, toc and search dialog", async () => {
  for (const page of docsPages) {
    const html = await docsPage(page.file);
    assert.equal(countOccurrences(html, 'class="layout"'), 1, `${page.path} layout`);
    assert.equal(countOccurrences(html, 'id="main"'), 1, `${page.path} main`);
    assert.equal(countOccurrences(html, '<main class="content"'), 1, `${page.path} main element`);
    assert.equal(countOccurrences(html, 'id="docs-sidebar"'), 1, `${page.path} sidebar`);
    assert.equal(countOccurrences(html, 'id="page-toc"'), 1, `${page.path} toc`);
    assert.equal(countOccurrences(html, 'id="search-modal"'), 1, `${page.path} search dialog`);
    assert.equal(countOccurrences(html, 'aria-current="page"'), 1, `${page.path} current page marker`);
    assert.equal(countOccurrences(html, "docs:head"), 0, `${page.path} chrome marker`);
    assert.equal(countOccurrences(html, "docs:foot"), 0, `${page.path} chrome marker`);
    assert.ok(!html.includes("version-select"), `${page.path} still offers a version selector`);
    assert.ok(html.includes(versions.docs), `${page.path} should state the documented version`);
  }
});

test("docs navigation stays within the current language and every fragment resolves", async () => {
  for (const [locale, navigation, registry] of [
    ["en", docsNav, docsPagesEn],
    ["zh", docsNavZh, docsPagesZh],
  ] as const) {
    const items = navigation.flatMap((group) => group.items);

    for (const item of items) {
      const hashIndex = item.href.indexOf("#");
      const path = hashIndex === -1 ? item.href : item.href.slice(0, hashIndex);
      const fragment = hashIndex === -1 ? "" : item.href.slice(hashIndex + 1);
      const entry = registry.find((page) => page.path === path);
      assert.ok(entry, `${locale} docs navigation ${item.href} should point at a registered page`);
      assert.equal(item.href.startsWith("/zh/"), locale === "zh", `${item.href} language`);
      const target = await docsPage(entry.file);
      if (fragment !== "") {
        assert.ok(idsOf(target).has(fragment), `docs navigation ${item.href} has no target id`);
      }
    }

    for (const page of registry) {
      const html = await docsPage(page.file);
      const links = docsSidebarLinks(html);
      assert.equal(links.length, items.length + 1, `${page.path} sidebar item count including language`);
      for (const item of items) {
        assert.ok(links.includes(item.href), `${page.path} sidebar is missing ${item.href}`);
      }
      for (const group of navigation) {
        assert.ok(html.includes(`>${group.title}<`), `${page.path} sidebar is missing group ${group.title}`);
      }
    }
  }
});

test("the website navigation and footer match each language registry", async () => {
  for (const [locale, navigation, footer, registry] of [
    ["en", primaryNav, footerNav, websitePagesEn],
    ["zh", primaryNavZh, footerNavZh, websitePagesZh],
  ] as const) {
    const expectedNav = navigation.map((item) => ({ label: item.label, href: expectedWithOrigins(item.href) }));
    const expectedFooter = footer.map((item) => ({ label: item.label, href: expectedWithOrigins(item.href) }));

    for (const page of registry) {
      const html = await websitePage(page.file);
      assert.deepEqual(navLinks(html), expectedNav, `${locale} ${page.path} navigation`);
      assert.deepEqual(footerLinks(html), expectedFooter, `${locale} ${page.path} footer`);
    }
  }
});

test("canonical URLs use each page's own configured origin", async () => {
  for (const [dist, registry, origin, read] of [
    [websiteDist, websitePages, BUILT.website, websitePage],
    [docsDist, docsPages, BUILT.docs, docsPage],
  ] as const) {
    for (const page of registry) {
      const html = await read(page.file);
      // Authored metadata wraps across lines, so match against flattened text.
      const flat = html.replace(/\s+/g, " ");
      const canonical = /<link rel="canonical" href="([^"]+)"/.exec(flat)?.[1];
      const ogUrl = /<meta property="og:url" content="([^"]+)"/.exec(flat)?.[1];
      assert.equal(canonical, `${origin}${page.path}`, `${page.path} canonical in ${dist}`);
      assert.equal(ogUrl, `${origin}${page.path}`, `${page.path} og:url in ${dist}`);
      assert.ok(/<meta property="og:title" content="[^"]+"/.test(flat), `${page.path} og:title`);
      assert.ok(/<meta property="og:description" content="[^"]+"/.test(flat), `${page.path} og:description`);
    }
  }
});

test("cross-site links resolve inside the other built site", async () => {
  let checked = 0;

  for (const page of websitePages) {
    const html = await websitePage(page.file);
    for (const href of crossSiteHrefs(html, BUILT.docs)) {
      const target = resolveBuiltTarget(href, docsPages);
      const targetHtml = await docsPage(target.file);
      if (target.fragment !== "") {
        assert.ok(idsOf(targetHtml).has(target.fragment), `${page.path} -> ${href} has no target id`);
      }
      checked += 1;
    }
  }

  for (const page of docsPages) {
    const html = await docsPage(page.file);
    for (const href of crossSiteHrefs(html, BUILT.website)) {
      const target = resolveBuiltTarget(href, websitePages);
      const targetHtml = await websitePage(target.file);
      if (target.fragment !== "") {
        assert.ok(idsOf(targetHtml).has(target.fragment), `${page.path} -> ${href} has no target id`);
      }
      checked += 1;
    }
  }

  assert.ok(checked > 8, `expected several cross-site links, checked ${checked}`);

  // Each homepage funnels to the same-language docs home, platform guide and
  // server guide, with no cross-language navigation.
  for (const [file, prefix] of [
    ["index.html", ""],
    ["zh/index.html", "/zh"],
  ] as const) {
    const home = await websitePage(file);
    assert.ok(home.includes(`href="${BUILT.docs}${prefix}/"`), `${file} should link to its docs home`);
    assert.ok(
      home.includes(`href="${BUILT.docs}${prefix}/getting-started/server/"`),
      `${file} should offer the self-hosted server guide`,
    );
    for (const platform of platforms) {
      assert.ok(
        home.includes(`href="${BUILT.docs}${prefix}/platforms/${platform.id}/"`),
        `${platform.name} should be reachable from ${file}`,
      );
    }
  }
});

test("the overview teaches the three-command flow and no retired surface", async () => {
  const overview = await docsPage("index.html");
  const flat = authoredText(overview).replace(/\s+/g, " ");

  // DOC-01: the getting-started flow walks the three accepted commands.
  assert.ok(flat.includes("syndroo connect"), "the overview should start with connect");
  assert.ok(flat.includes("syndroo publish"), "the overview should show the publish command");
  assert.ok(flat.includes("syndroo status"), "the overview should show the status command");
  assert.ok(
    flat.includes("syndroo publish --input post.json"),
    "the overview should show the file input",
  );
  assert.ok(
    flat.includes("syndroo publish --input -"),
    "the overview should show the stdin execute step",
  );
  assert.ok(
    flat.includes(PUBLIC_NODE_RUNTIME),
    "the overview should state the runtime it needs",
  );

  // Retired surfaces: the hosted HTTP API and the mock gate. The old command
  // families are audited separately in tests/docs-commands.test.ts, which reads
  // the rendered text rather than a hand-kept list.
  const retiredRoutes = ["/accounts/", "/agent-setup/", "/commands/", "/faq/", "/publishing/"];

  for (const page of docsPagesEn) {
    const html = await docsPage(page.file);
    const text = authoredText(html);
    for (const legacy of ["/v1/posts", "Mock SNS", "@syndroo/sdk", "@syndroo/cloudflare-worker"]) {
      assert.ok(!text.includes(legacy), `${page.path} still mentions the retired surface ${legacy}`);
    }
    for (const route of retiredRoutes) {
      assert.ok(!html.includes(`href="${route}"`), `${page.path} still links the retired route ${route}`);
    }
  }
});

test("no page teaches the removed public plan workflow or a preview expiry", async () => {
  const removed = ["--plan", "planId", "frozen plan", "expired plan", "24 hours"];

  for (const [label, read, registry] of [
    ["website", websitePage, websitePages],
    ["docs", docsPage, docsPages],
  ] as const) {
    for (const page of registry) {
      const text = authoredText(await read(page.file)).replace(/\s+/g, " ");
      for (const phrase of removed) {
        assert.ok(!text.includes(phrase), `${label} ${page.path} still teaches ${phrase}`);
      }
    }
  }
});

test("the documentation states the input, authorization and retry rules", async () => {
  const flatten = async (file: string): Promise<string> =>
    authoredText(await docsPage(file)).replace(/\s+/g, " ");

  const overview = await flatten("index.html");
  const local = await flatten("getting-started/local-cli/index.html");
  const cli = await flatten("reference/cli/index.html");
  const requests = await flatten("reference/requests/index.html");
  const agent = await flatten("getting-started/agent/index.html");

  assert.ok(cli.includes("--data"), "the command reference should document --data");
  assert.ok(cli.includes("--yes"), "the command reference should document --yes");
  assert.ok(
    /Publish to N accounts\? \[y\/N\/v\]/.test(cli) &&
      /Publish to N accounts\? \[y\/N\/v\]/.test(local),
    "the guides should show the confirmation prompt",
  );
  assert.ok(
    /stderr/i.test(cli),
    "the CLI reference should place verbose diagnostics on stderr",
  );
  assert.ok(
    /not_started/.test(overview) && /not_started/.test(requests),
    "the docs should keep unknown distinct from a target that never started",
  );
  assert.ok(overview.includes("--input -"), "the overview should document the stdin input");
  assert.ok(
    /exactly one input source/i.test(cli),
    "the command reference should state input exclusivity",
  );
  assert.ok(/process arguments/i.test(local), "the CLI guide should warn about argv exposure");
  assert.ok(
    /never a place for credentials/i.test(cli),
    "the command reference should separate content from credentials",
  );
  assert.ok(
    /not a grant of authority/i.test(agent),
    "the agent page should state that a confirmation prompt is not user authorization",
  );
  assert.ok(
    /single-use/i.test(local),
    "the CLI guide should state that the approval token is single-use",
  );
  assert.ok(
    /frozen before it is sent/i.test(local),
    "the CLI guide should state the source snapshot rule",
  );
  assert.ok(
    /never retryable/i.test(requests),
    "the request reference should forbid retrying an unknown write",
  );
  assert.ok(/without writing state/i.test(local), "dry-run must not write local state");
  assert.ok(
    /resolving credentials/i.test(local),
    "dry-run must not resolve credentials",
  );
  assert.ok(/do not parse the message/i.test(agent), "agents must branch on the code, not the text");
  assert.ok(
    /process arguments/i.test(agent) && agent.includes("--input -"),
    "agents need an argv warning and stdin alternative",
  );
});

test("the docs keep the frozen history, live progress and the yes/json boundary apart", async () => {
  const flatten = async (file: string): Promise<string> =>
    authoredText(await docsPage(file)).replace(/\s+/g, " ");

  const overview = await flatten("index.html");
  const local = await flatten("getting-started/local-cli/index.html");
  const cli = await flatten("reference/cli/index.html");
  const requests = await flatten("reference/requests/index.html");
  const home = authoredText(await websitePage("index.html")).replace(/\s+/g, " ");

  // A retry is prepared and then confirmed by --yes; an explicit execute
  // request already carries its own authorization. The old "adds nothing on an
  // explicit execute or retry" claim would be wrong for the retry.
  assert.ok(
    cli.includes("a retry prepares the selected eligible subset") &&
      cli.includes("confirms and executes that same frozen retry"),
    "the CLI reference should state that --yes confirms a prepared retry",
  );
  assert.ok(
    !cli.includes("on an explicit execute or retry it adds nothing"),
    "the CLI reference must not claim --yes does nothing on a retry",
  );

  // Live progress is a durable post-commit projection with a serial order and
  // a redraw-or-append rendering rule; --json keeps a single clean envelope.
  for (const phrase of [
    "post-commit",
    "Publishing",
    "Waiting",
    "redrawn in place",
    "appended log",
    "restore the cursor",
    "controlling terminal",
    "no progress, no prompt",
  ]) {
    assert.ok(cli.includes(phrase), `the CLI reference should describe live progress: ${phrase}`);
  }

  // The recorded status reads history back and never rewrites it.
  for (const phrase of ["recorded result", "never rewrites history", "unavailable"]) {
    assert.ok(requests.includes(phrase), `the request reference should describe ${phrase}`);
  }
  assert.ok(
    !requests.includes('"account": {}'),
    "the published result samples must carry a complete account identity",
  );

  // The yes/json boundary: a prepare-only run returns the prepared result, a
  // --yes run prints one final envelope.
  assert.ok(
    overview.includes("one final envelope") && overview.includes("no approval token"),
    "the overview should distinguish a prepare-only run from --yes --json",
  );
  assert.ok(
    local.includes("An explicit execute request") &&
      !local.includes("Executing is only possible from standard input"),
    "the CLI guide should scope the stdin rule to an explicit execute request",
  );
  assert.ok(
    home.includes("one final envelope") && home.includes("--yes"),
    "the homepage should state the one-call yes/json behaviour",
  );
  assert.ok(
    !home.includes("6f2a") && home.includes("<operationId>"),
    "the homepage should never teach querying a truncated operation id",
  );
});

test("robots.txt and sitemap.xml come from the registry and the configured origins", async () => {
  for (const [dist, registry, origin] of [
    [websiteDist, websitePages, BUILT.website],
    [docsDist, docsPages, BUILT.docs],
  ] as const) {
    const robots = await readFile(join(dist, "robots.txt"), "utf8");
    // Next.js writes this file from app/robots.ts, so the contract is the rules
    // and the configured sitemap URL, not the exact casing or spacing.
    assert.match(robots, /^User-[Aa]gent: \*\nAllow: \/\n/m);
    assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`), `${dist} robots sitemap URL`);
    assertNoLoopback(robots, `${dist} robots`);

    const sitemap = await readFile(join(dist, "sitemap.xml"), "utf8");
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    assert.deepEqual(
      locs,
      registry.map((page) => `${origin}${page.path}`),
      `${dist} sitemap entries`,
    );
    assertNoLoopback(sitemap, `${dist} sitemap`);
  }
});

test("both exports ship the shared theme control and its production cookie", async () => {
  for (const [dist, site] of [
    [websiteDist, "@syndroo/website"],
    [docsDist, "@syndroo/docs"],
  ] as const) {
    const html = await readFile(join(dist, "index.html"), "utf8");
    assert.ok(html.includes("syndroo-theme"), `${site} should carry the shared theme key`);
    assert.ok(html.includes('class="theme-toggle"'), `${site} should render a visible theme control`);
    assert.ok(html.includes("data-theme"), `${site} should set the theme attribute`);

    const chunks = (await listFiles(join(dist, "_next", "static", "chunks"))).filter((file) =>
      file.endsWith(".js"),
    );
    assert.ok(chunks.length > 0, `${site} should export client chunks`);

    let sawCookieWriter = false;
    let sawToggle = false;
    for (const file of chunks) {
      const script = await readFile(file, "utf8");
      if (script.includes("Domain=syndroo.com")) {
        sawCookieWriter = true;
      }
      if (script.includes("theme-toggle")) {
        sawToggle = true;
      }
    }
    assert.ok(sawCookieWriter, `${site} bundle should write the shared cookie`);
    assert.ok(sawToggle, `${site} bundle should render the theme control`);
  }
});

test("version claims stay consistent and no unpublished surface is offered", async () => {
  // The only product version any page may state is the local CLI candidate these
  // docs describe; everything else has to be quoted as a third-party version.
  const allowedVersions = new Set([versions.cli, versions.docs]);
  // The lookbehind keeps a version out of a dotted quad such as `127.0.0.1`.
  // The lookahead allows a sentence-ending period but still rejects a longer
  // version or a file extension.
  const versionPattern = /(?<![\w.])0\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?(?!\w|\.[\w])/g;

  for (const [dist, registry] of [
    [websiteDist, websitePages],
    [docsDist, docsPages],
  ] as const) {
    for (const page of registry) {
      // Scan authored page text only: the serialized RSC payload is not prose
      // and can split a sentence across chunks. Tarball filenames embed a
      // version plus an extension, so they are replaced before the scan rather
      // than read as a version claim.
      const html = (await readFile(join(dist, page.file), "utf8"))
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
        .replace(/[^\s"'<>]*\.tgz\b/g, "<tarball>");

      for (const version of html.match(versionPattern) ?? []) {
        assert.ok(
          allowedVersions.has(version),
          `${page.path} mentions the version ${version}, which is not a configured version fact`,
        );
      }

      // Nothing is published to a registry, so no page may offer an install
      // command for a package name.
      const registryInstallPattern =
        /npm (?:install|i|add) (?:-g |--global |-D |--save-dev )?(?:syndroo|@syndroo\/)|npx (?:-y |--yes )?@syndroo\/|pnpm (?:add|install) (?:syndroo|@syndroo\/)|yarn add (?:syndroo|@syndroo\/)/g;
      for (const match of html.matchAll(registryInstallPattern)) {
        const before = html.slice(Math.max(0, match.index - 24), match.index);
        assert.match(
          before,
          /\b(no|not|never)\b/i,
          `${page.path} offers an install command for an unpublished package`,
        );
      }
    }
  }

  for (const [label, html] of [
    ["the English marketing home", await websitePage("index.html")],
    ["the English docs home", await docsPage("index.html")],
  ] as const) {
    assert.ok(html.includes(versions.cli), `${label} should state the candidate version`);
    assert.ok(html.includes(versions.releaseStage), `${label} should state the release stage`);
  }
  for (const [label, html] of [
    ["the Chinese marketing home", await websitePage("zh/index.html")],
    ["the Chinese docs home", await docsPage("zh/index.html")],
  ] as const) {
    assert.ok(html.includes(versions.cli), `${label} should state the candidate version`);
    assert.match(html, /候选版本|未发布/, `${label} should state the release stage`);
  }
});

test("the built export carries the configured pair and the sources keep the defaults", async () => {
  // The authored sources keep the historical loopback defaults and every build
  // rewrites the configured pair. These fixtures read that built output, so a
  // loopback origin the build was not configured for is a real leak.
  for (const source of ["packages/content/site-data.ts", "scripts/lib/origins.ts", "apps/docs/lib/origins.ts"]) {
    const text = await readFile(join(repoRoot, source), "utf8");
    assert.ok(
      text.includes(DEFAULT_WEBSITE_ORIGIN) && text.includes(DEFAULT_DOCS_ORIGIN),
      `${source} should keep the documented loopback defaults`,
    );
  }

  for (const [dist, site] of [
    [websiteDist, "@syndroo/website"],
    [docsDist, "@syndroo/docs"],
  ] as const) {
    const html = await readFile(join(dist, "index.html"), "utf8");
    assertNoLoopback(html, site);
    assert.ok(
      html.includes(BUILT.website) || html.includes(BUILT.docs),
      `${site} should use the configured origin pair`,
    );
  }
});
