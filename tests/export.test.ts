// Export fixtures for the Next.js static output.
//
// These run against the committed `out/` directories produced by
// `npm run build` (CI runs build, then check, then test). They cover what the
// static export has to guarantee: independent per-app output, the registered
// pages, the configured origins, no server-only Next.js dependency, and the
// v0.4.0 shell/mascot/theme invariants that can be checked statically.
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

import { SITE_TARGETS } from "../scripts/lib/app-targets.ts";
import { auditDist } from "../scripts/lib/audit.ts";
import { listFiles, toPosix, extensionOf } from "../scripts/lib/files.ts";
import { rewriteOriginsInDirectory } from "../scripts/lib/origin-rewrite.ts";
import { repoRoot } from "../scripts/lib/paths.ts";
import {
  DEFAULT_DOCS_ORIGIN,
  DEFAULT_WEBSITE_ORIGIN,
  applyOrigins,
  requireRootOrigin,
  resolveOrigins,
  type Origins,
} from "../scripts/lib/origins.ts";
import { docsPages, websitePages } from "../packages/content/site-data.ts";

const CUSTOM: Origins = { website: "https://www.example.com", docs: "https://docs.example.com" };
const DEFAULTS: Origins = { website: DEFAULT_WEBSITE_ORIGIN, docs: DEFAULT_DOCS_ORIGIN };

const WEBSITE = SITE_TARGETS[0];
const DOCS = SITE_TARGETS[1];

async function exportedFiles(root: string): Promise<string[]> {
  return (await listFiles(root)).map((file) => toPosix(relative(root, file)));
}

/** Every export must exist; `npm test` runs after `npm run build` in CI. */
async function requireExport(): Promise<void> {
  for (const site of SITE_TARGETS) {
    if ((await listFiles(site.outRoot)).length === 0) {
      throw new Error(`${site.name} has no export at ${site.outRoot}; run \`npm run build\` first`);
    }
  }
}

test("origin parsing accepts bare http(s) origins and normalizes them", () => {
  assert.equal(requireRootOrigin("X", "https://www.example.com"), "https://www.example.com");
  assert.equal(requireRootOrigin("X", "https://www.example.com/"), "https://www.example.com");
  assert.equal(requireRootOrigin("X", "https://example.com:8443"), "https://example.com:8443");
  assert.equal(requireRootOrigin("X", DEFAULT_WEBSITE_ORIGIN), DEFAULT_WEBSITE_ORIGIN);
});

test("origin parsing rejects paths, queries, fragments, credentials and other schemes", () => {
  const rejected = [
    "https://example.com/site",
    "https://example.com?x=1",
    "https://example.com#top",
    "https://user:secret@example.com",
    "ftp://example.com",
    "localhost:4173",
    "/relative",
    "not a url",
    "",
  ];
  for (const raw of rejected) {
    assert.throws(() => requireRootOrigin("WEBSITE_ORIGIN", raw), /WEBSITE_ORIGIN/, `${raw} should be rejected`);
  }
});

test("the configured origin pair defaults to the loopback pair and must stay distinct", () => {
  assert.deepEqual(resolveOrigins({}), DEFAULTS);
  assert.deepEqual(resolveOrigins({ WEBSITE_ORIGIN: "", DOCS_ORIGIN: "" }), DEFAULTS);
  assert.deepEqual(resolveOrigins({ WEBSITE_ORIGIN: "https://a.example", DOCS_ORIGIN: "https://b.example" }), {
    website: "https://a.example",
    docs: "https://b.example",
  });
  assert.throws(() => resolveOrigins({ WEBSITE_ORIGIN: "https://same.example", DOCS_ORIGIN: "https://same.example" }));
});

test("both sites export independently with their registered pages and generated files", async () => {
  await requireExport();

  const website = await exportedFiles(WEBSITE.outRoot);
  const docs = await exportedFiles(DOCS.outRoot);

  for (const page of websitePages) {
    assert.ok(website.includes(page.file), `website export should contain ${page.file}`);
  }
  for (const page of docsPages) {
    assert.ok(docs.includes(page.file), `docs export should contain ${page.file}`);
  }

  assert.ok(website.includes("robots.txt"), "the website export should contain robots.txt");
  assert.ok(website.includes("sitemap.xml"), "the website export should contain sitemap.xml");
  assert.ok(docs.includes("robots.txt"), "the docs export should contain robots.txt");
  assert.ok(docs.includes("sitemap.xml"), "the docs export should contain sitemap.xml");

  for (const asset of ["assets/logo.svg", "assets/favicon.svg", "assets/droo-publishing.png"]) {
    assert.ok(website.includes(asset), `${asset} should be exported by the website`);
    assert.ok(docs.includes(asset), `${asset} should be exported by the docs site`);
  }

  // Neither export may publish sources, maps, environment files or the other
  // app's pages.
  for (const file of [...website, ...docs]) {
    assert.ok(!/\.(ts|tsx|md|mdx|map)$/.test(file), `${file} must not be published`);
    assert.ok(!/(^|\/)\.env/.test(file), `${file} must not be published`);
  }
  assert.ok(
    !website.some((file) => file.startsWith("quickstart/") || file.startsWith("platforms/")),
    "the website export must not contain documentation pages",
  );
  assert.ok(
    !docs.some((file) => file.startsWith("blog/")),
    "the docs export must not contain marketing pages",
  );
});

test("both exports are internally consistent and carry no server dependency", async () => {
  await requireExport();

  for (const site of SITE_TARGETS) {
    const summary = await auditDist({
      distRoot: site.outRoot,
      origins: DEFAULTS,
      expectedPages: [...site.expectedPages],
    });
    assert.deepEqual(summary.issues, [], `${site.name} should have no export issues`);

    for (const file of await listFiles(site.outRoot)) {
      if (extensionOf(file) !== ".html") {
        continue;
      }
      const html = await readFile(file, "utf8");
      assert.ok(!html.includes("__NEXT_DATA__"), `${file} must not carry a pages-router payload`);
      assert.ok(!html.includes("__nextjs_original-stack-frame"), `${file} must not carry a dev overlay`);
    }

    // A static export has no server runtime output at all.
    assert.ok(
      !(await exportedFiles(site.outRoot)).some((file) => file.startsWith("server/")),
      `${site.name} must not export server code`,
    );
  }
});

test("a custom origin pair rewrites the export without touching product sample URLs", async (t) => {
  await requireExport();
  const root = await mkdtemp(join(tmpdir(), "syndroo-origins-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  for (const site of SITE_TARGETS) {
    const target = join(root, site.name.replace("@syndroo/", ""));
    await cp(site.outRoot, target, { recursive: true });
    await rewriteOriginsInDirectory(target, CUSTOM);

    const summary = await auditDist({
      distRoot: target,
      origins: CUSTOM,
      expectedPages: [...site.expectedPages],
    });
    assert.deepEqual(summary.issues, [], `${site.name} should be clean for ${CUSTOM.website}`);

    const home = await readFile(join(target, "index.html"), "utf8");
    assert.ok(
      home.includes(`href="${CUSTOM.docs}/"`) || home.includes(`href="${CUSTOM.website}/"`),
      `${site.name} should link to the configured origins`,
    );
    assert.ok(
      !home.includes(DEFAULT_WEBSITE_ORIGIN) && !home.includes(DEFAULT_DOCS_ORIGIN),
      `${site.name} must not leak a loopback origin once a custom pair is configured`,
    );
  }

  // The Worker sample URL in the docs is content, not a cross-site link.
  const quickstart = await readFile(join(root, "docs", "quickstart", "index.html"), "utf8");
  assert.ok(quickstart.includes("http://localhost:8787"), "Worker sample URLs must not be rewritten");
});

test("swapping the two origins cannot cascade through the rewrite", () => {
  // A custom marketing origin may equal the original documentation origin; the
  // rewrite must be single-pass or the replacement text is rewritten again.
  const swapped: Origins = { website: DEFAULT_DOCS_ORIGIN, docs: "https://docs.example.com" };
  const source = `a ${DEFAULT_WEBSITE_ORIGIN} b ${DEFAULT_DOCS_ORIGIN} c`;
  assert.equal(applyOrigins(source, swapped), `a ${DEFAULT_DOCS_ORIGIN} b https://docs.example.com c`);
});

test("the exported stylesheets carry the v0.4.0 shell, mascot and theme rules", async () => {
  await requireExport();

  const websiteCssFiles = (await listFiles(WEBSITE.outRoot)).filter((file) => file.endsWith(".css"));
  const docsCssFiles = (await listFiles(DOCS.outRoot)).filter((file) => file.endsWith(".css"));
  assert.ok(websiteCssFiles.length > 0, "the website export should contain a stylesheet");
  assert.ok(docsCssFiles.length > 0, "the docs export should contain a stylesheet");
  const websiteCss = (await Promise.all(websiteCssFiles.map((file) => readFile(file, "utf8")))).join("\n");
  // Production CSS is minified, so these assertions are written against the
  // minified shape (no space after the colon).

  // CR-040-05: the last `.wrap` rule removes the 1160px cap, so the shell grows
  // with the viewport instead of swapping one fixed width for another.
  const wrapRules = [...websiteCss.matchAll(/\.wrap\{([^}]*)\}/g)].map((match) => match[1]);
  assert.ok(wrapRules.length > 0, "the marketing stylesheet should define .wrap");
  assert.ok(
    wrapRules[wrapRules.length - 1].includes("max-width:none"),
    "the effective .wrap rule must drop the fixed cap",
  );
  assert.ok(/clamp\(20px,\s*3vw,\s*64px\)/.test(websiteCss), "the marketing shell needs a clamp gutter");

  // CR-040-06: per-role mascot sizes, and no circular crop on the image.
  assert.ok(/--mascot-hero:320px/.test(websiteCss), "the hero mascot should start at 320px");
  assert.ok(/--mascot-cta:200px/.test(websiteCss), "the CTA mascot should be 200px on desktop");
  assert.ok(/--mascot-hero:220px/.test(websiteCss), "the hero mascot should shrink on mobile");
  assert.ok(/--mascot-cta:160px/.test(websiteCss), "the CTA mascot should shrink on mobile");
  assert.ok(/\.demo__mascot\{[^}]*border-radius:0/.test(websiteCss), "the mascot image must not be circularly cropped");
  assert.ok(websiteCss.includes(".hero__mascot-glow"), "the glow must be its own layer behind the image");

  const docsCss = (await Promise.all(docsCssFiles.map((file) => readFile(file, "utf8")))).join("\n");
  // CR-040-07: header, main and footer share one shell width and gutter.
  assert.ok(/--shell-max:1560px/.test(docsCss), "the docs shell needs a shared width token");
  assert.ok(/--shell-gutter:24px/.test(docsCss), "the docs shell needs a shared gutter token");
  assert.ok(/--shell-gutter:16px/.test(docsCss), "the docs shell gutter should shrink on narrow viewports");
  const shellRule = docsCss.match(/[^{}]*\{[^}]*max-width:var\(--shell-max\)[^}]*\}/);
  assert.ok(shellRule, "the docs shell rule should use the shared width token");
  for (const selector of [".topbar-inner", ".layout", ".footer-inner"]) {
    assert.ok(
      shellRule[0].includes(selector),
      `the shared docs shell rule must cover ${selector}`,
    );
  }
  assert.ok(/main article\{[^}]*max-width:78ch/.test(docsCss), "the docs article column should stay a readable measure");
});

test("both exports ship the shared theme control and its production cookie", async () => {
  await requireExport();

  for (const site of SITE_TARGETS) {
    const html = await readFile(join(site.outRoot, "index.html"), "utf8");
    assert.ok(html.includes("syndroo-theme"), `${site.name} should carry the shared theme key`);
    assert.ok(html.includes('class="theme-toggle"'), `${site.name} should render a visible theme control`);

    const chunks = (await listFiles(join(site.outRoot, "_next", "static", "chunks"))).filter((file) =>
      file.endsWith(".js"),
    );
    assert.ok(chunks.length > 0, `${site.name} should export client chunks`);

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
    assert.ok(sawCookieWriter, `${site.name} bundle should write the shared cookie`);
    assert.ok(sawToggle, `${site.name} bundle should render the theme control`);
  }

  const cookieWriters = await readFile(join(repoRoot, "packages/theme/src/index.tsx"), "utf8");
  assert.ok(cookieWriters.includes("Domain=syndroo.com"), "the shared cookie must be scoped to syndroo.com");
  assert.ok(cookieWriters.includes("SameSite=Lax"), "the shared cookie must set SameSite");
});
