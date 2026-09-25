// Content fixtures for the published surfaces.
//
// Everything here reads the built output of the two sites: the seven public
// pages (the marketing home, the six documentation pages, and the technical
// 404 documents Next.js generates), the shared navigation, the metadata, the
// generated files, the theme control and the way cross-site links resolve.
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
  docsPages,
  footerNav,
  platforms,
  primaryNav,
  versions,
  websitePages,
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
 * The seven public pages, in the order the sites publish them. A page that is
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
  const block = /<nav class="site-nav" id="site-nav" aria-label="Main">([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? "";
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

test("the published surfaces are exactly the seven pages readers were promised", () => {
  assert.deepEqual(PUBLIC_PAGES, [
    "website /",
    "docs /",
    "docs /accounts/",
    "docs /publishing/",
    "docs /agent-setup/",
    "docs /commands/",
    "docs /faq/",
  ]);
  assert.equal(PUBLIC_PAGES.length, 7, "the public surface is seven pages");
  assert.equal(websitePages.length, 1, "the marketing site is a single page");
  assert.equal(docsPages.length, 6, "the documentation site is six pages");
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

test("docs navigation lists every registered page and every fragment resolves", async () => {
  const items = docsNav.flatMap((group) => group.items);

  for (const item of items) {
    const hashIndex = item.href.indexOf("#");
    const path = hashIndex === -1 ? item.href : item.href.slice(0, hashIndex);
    const fragment = hashIndex === -1 ? "" : item.href.slice(hashIndex + 1);
    const entry = docsPages.find((page) => page.path === path);
    assert.ok(entry, `docs navigation ${item.href} should point at a registered page`);
    const target = await docsPage(entry.file);
    if (fragment !== "") {
      assert.ok(idsOf(target).has(fragment), `docs navigation ${item.href} has no target id`);
    }
  }

  for (const page of docsPages) {
    const html = await docsPage(page.file);
    const links = docsSidebarLinks(html);
    assert.equal(links.length, items.length, `${page.path} sidebar item count`);
    for (const item of items) {
      assert.ok(links.includes(item.href), `${page.path} sidebar is missing ${item.href}`);
    }
    for (const group of docsNav) {
      assert.ok(html.includes(`>${group.title}<`), `${page.path} sidebar is missing group ${group.title}`);
    }
  }
});

test("the website navigation and footer match the shared registry", async () => {
  const expectedNav = primaryNav.map((item) => ({ label: item.label, href: expectedWithOrigins(item.href) }));
  const expectedFooter = footerNav.map((item) => ({ label: item.label, href: expectedWithOrigins(item.href) }));

  for (const page of websitePages) {
    const html = await websitePage(page.file);
    assert.deepEqual(navLinks(html), expectedNav, `${page.path} navigation`);
    assert.deepEqual(footerLinks(html), expectedFooter, `${page.path} footer`);
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

  // The hero actions are the primary funnel into the docs site, and the
  // platform strip links every platform to its own guide.
  const home = await websitePage("index.html");
  assert.ok(home.includes(`href="${BUILT.docs}/"`), "the hero should link to the docs home");
  assert.ok(home.includes(`href="${BUILT.docs}/commands/"`), "the hero should offer the command reference");
  for (const platform of platforms) {
    assert.ok(
      home.includes(`href="${BUILT.docs}/accounts/"`),
      `${platform.name} should be reachable from the platform strip`,
    );
  }
});

test("the docs lookup pages name the local path and no retired surface", async () => {
  const quickstart = await docsPage("index.html");
  const flat = authoredText(quickstart).replace(/\s+/g, " ");

  assert.ok(flat.includes("syndroo init"), "the quickstart should show the local init command");
  assert.ok(flat.includes("syndroo doctor --local"), "the quickstart should show the local doctor command");
  assert.ok(
    flat.includes("syndroo publish --input post.json --dry-run"),
    "the quickstart should show the preview command",
  );
  assert.ok(flat.includes(PUBLIC_NODE_RUNTIME), "the quickstart should state the runtime it needs");

  for (const page of docsPages) {
    const text = authoredText(await docsPage(page.file));
    // Retired surfaces: the hosted HTTP API, the mock gate and the old clients.
    for (const legacy of ["/v1/posts", "Mock SNS", "Idempotency-Key", "@syndroo/sdk", "@syndroo/cloudflare-worker"]) {
      assert.ok(!text.includes(legacy), `${page.path} still mentions the retired surface ${legacy}`);
    }
  }
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
    ["the marketing home", await websitePage("index.html")],
    ["the docs home", await docsPage("index.html")],
  ] as const) {
    assert.ok(html.includes(versions.cli), `${label} should state the candidate version`);
    assert.ok(html.includes(versions.releaseStage), `${label} should state the release stage`);
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
