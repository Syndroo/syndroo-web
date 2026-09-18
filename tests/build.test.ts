// Build fixtures: origin handling, app isolation and what a build refuses to
// ingest. Every build here writes into a temporary directory; the repository
// build output is only read, never replaced.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { docsBuild } from "../apps/docs/app.config.ts";
import { websiteBuild } from "../apps/website/app.config.ts";
import { buildApp } from "../scripts/lib/build-app.ts";
import { auditDist } from "../scripts/lib/audit.ts";
import { listFiles, toPosix } from "../scripts/lib/files.ts";
import {
  DEFAULT_DOCS_ORIGIN,
  DEFAULT_WEBSITE_ORIGIN,
  applyOrigins,
  requireRootOrigin,
  resolveOrigins,
  type Origins,
} from "../scripts/lib/origins.ts";
import { repoRoot } from "../scripts/lib/paths.ts";

const execFileAsync = promisify(execFile);

const CUSTOM: Origins = { website: "https://www.example.com", docs: "https://docs.example.com" };
const DEFAULTS: Origins = { website: DEFAULT_WEBSITE_ORIGIN, docs: DEFAULT_DOCS_ORIGIN };

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

async function relativeFiles(root: string): Promise<string[]> {
  return (await listFiles(root)).map((file) => toPosix(relative(root, file)));
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

test("the configured origins must be distinct and default to the loopback pair", () => {
  assert.deepEqual(resolveOrigins({}), DEFAULTS);
  assert.throws(
    () => resolveOrigins({ WEBSITE_ORIGIN: "https://a.example", DOCS_ORIGIN: "https://a.example" }),
    /distinct/,
  );
});

test("origin rewriting is a single pass and never cascades", () => {
  const page = `<a href="${DEFAULT_DOCS_ORIGIN}/">Docs</a><a href="${DEFAULT_WEBSITE_ORIGIN}/">Website</a>`;

  // Legal but tricky: the marketing origin is configured as the original docs
  // origin. A two-step replacement would rewrite the first result again.
  const swapped: Origins = { website: DEFAULT_DOCS_ORIGIN, docs: "https://docs.example.com" };
  assert.equal(
    applyOrigins(page, swapped),
    `<a href="https://docs.example.com/">Docs</a><a href="${DEFAULT_DOCS_ORIGIN}/">Website</a>`,
  );

  // An origin that itself contains the other original origin must not be
  // rewritten by its own replacement.
  const prefixed: Origins = { website: "https://localhost:4174.example.com", docs: "https://b.example" };
  assert.equal(
    applyOrigins(`x ${DEFAULT_WEBSITE_ORIGIN} y ${DEFAULT_DOCS_ORIGIN} z`, prefixed),
    "x https://localhost:4174.example.com y https://b.example z",
  );
});

test("website build rewrites cross-site links, copies shared assets and stays publishable", async (t) => {
  const root = await tempDir("syndroo-website-");
  t.after(() => rm(root, { recursive: true, force: true }));

  const config = websiteBuild(CUSTOM, join(root, "dist"));
  const result = await buildApp(config);
  const files = await relativeFiles(config.distRoot);

  assert.equal(result.pages.length, 7);
  assert.ok(files.includes("index.html"));
  assert.ok(files.includes("blog/safe-cross-posting-with-idempotency/index.html"));
  assert.ok(files.includes("css/site.css"));
  assert.ok(files.includes("js/site.js"));
  for (const asset of [
    "assets/logo.svg",
    "assets/favicon.svg",
    "assets/droo-publishing.png",
    "assets/platform-threads.svg",
  ]) {
    assert.ok(files.includes(asset), `${asset} should be copied into the build`);
  }
  assert.ok(
    !files.some((file) => /\.(ts|md|map)$/.test(file)),
    "sources, Markdown and maps must not be published",
  );

  const home = await readFile(join(config.distRoot, "index.html"), "utf8");
  assert.ok(home.includes(`href="${CUSTOM.docs}/"`), "docs links must use the configured docs origin");
  assert.ok(!home.includes(DEFAULT_DOCS_ORIGIN), "the default docs origin must be rewritten");

  const script = await readFile(join(config.distRoot, "js/site.js"), "utf8");
  assert.ok(script.includes("sourceURL=/js/site.js"), "generated script should point at its served path");

  const summary = await auditDist({
    distRoot: config.distRoot,
    origins: CUSTOM,
    expectedPages: config.expectedPages,
  });
  assert.deepEqual(summary.issues, []);
  assert.equal(summary.pages, 7);
  assert.ok(summary.references > 100);
});

test("docs build is independent from the website build and keeps product sample URLs", async (t) => {
  const root = await tempDir("syndroo-docs-");
  t.after(() => rm(root, { recursive: true, force: true }));

  const docs = docsBuild(CUSTOM, join(root, "docs"));
  const website = websiteBuild(CUSTOM, join(root, "website"));
  await buildApp(docs);
  await buildApp(website);

  const docsFiles = await relativeFiles(docs.distRoot);
  const websiteFiles = await relativeFiles(website.distRoot);

  // Every registered documentation page is built, whatever the current count is.
  assert.equal(docsFiles.filter((file) => file.endsWith("index.html")).length, docs.expectedPages.length);
  assert.ok(docsFiles.includes("platforms/bluesky/index.html"), "platform guides should be built");
  assert.ok(docsFiles.includes("doc.js"));
  assert.ok(docsFiles.includes("styles.css"));
  assert.ok(
    !docsFiles.some((file) => file.startsWith("blog/") || file.startsWith("css/")),
    "the docs build must not contain marketing-only paths",
  );

  assert.ok(websiteFiles.includes("css/site.css"));
  assert.ok(websiteFiles.includes("js/site.js"));
  assert.ok(
    !websiteFiles.includes("doc.js") && !websiteFiles.includes("styles.css"),
    "the website build must not contain docs-only paths",
  );

  const docsHome = await readFile(join(docs.distRoot, "index.html"), "utf8");
  assert.ok(docsHome.includes(`href="${CUSTOM.website}/"`), "docs must link back to the configured website origin");

  // Product sample URLs are content, not cross-site links, and must survive.
  const quickstart = await readFile(join(docs.distRoot, "quickstart/index.html"), "utf8");
  assert.ok(quickstart.includes("http://localhost:8787"), "Worker sample URLs must not be rewritten");

  for (const [label, config] of [
    ["docs", docs],
    ["website", website],
  ] as const) {
    const summary = await auditDist({
      distRoot: config.distRoot,
      origins: CUSTOM,
      expectedPages: config.expectedPages,
    });
    assert.deepEqual(summary.issues, [], `${label} build should have no audit issues`);
  }
});

test("a build whose marketing origin is the original docs origin stays clean", async (t) => {
  const root = await tempDir("syndroo-swapped-");
  t.after(() => rm(root, { recursive: true, force: true }));

  // Swapping the two origins is legal. It also catches a cascading rewrite,
  // because the replacement text is the other original origin.
  const swapped: Origins = { website: DEFAULT_DOCS_ORIGIN, docs: "https://docs.example.com" };
  const docs = docsBuild(swapped, join(root, "docs"));
  await buildApp(docs);

  const docsHome = await readFile(join(docs.distRoot, "index.html"), "utf8");
  assert.ok(
    docsHome.includes(`href="${DEFAULT_DOCS_ORIGIN}/"`),
    "the website link should keep the configured marketing origin",
  );
  // The page itself legitimately carries the configured docs origin in its own
  // canonical and og:url metadata; the marketing link must not have taken it.
  assert.ok(
    docsHome.includes('<link rel="canonical" href="https://docs.example.com/">'),
    "canonical metadata should use the configured docs origin",
  );
  const websiteLinks = docsHome.match(/href="http:\/\/localhost:4174\/"/g) ?? [];
  assert.ok(websiteLinks.length > 0, "cross-site website links should use the configured marketing origin");

  const summary = await auditDist({
    distRoot: docs.distRoot,
    origins: swapped,
    expectedPages: docs.expectedPages,
  });
  assert.deepEqual(summary.issues, []);
});

test("a build ignores configuration files, sources and symlinks in the source tree", async (t) => {
  const root = await tempDir("syndroo-ingest-");
  t.after(() => rm(root, { recursive: true, force: true }));

  const pages = join(root, "src/pages");
  const staticFiles = join(root, "src/static");
  const outside = join(root, "outside");
  await mkdir(pages, { recursive: true });
  await mkdir(staticFiles, { recursive: true });
  await mkdir(outside, { recursive: true });

  await writeFile(
    join(pages, "index.html"),
    '<!doctype html>\n<html lang="en">\n<head><title>Fixture</title><link rel="icon" href="/keep.svg"></head>\n<body><h1>Fixture</h1></body>\n</html>\n',
  );
  await writeFile(join(staticFiles, "keep.css"), "body { color: #000; }\n");
  await writeFile(join(staticFiles, "keep.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>\n');
  await writeFile(join(staticFiles, "package.json"), '{ "name": "must-not-ship" }\n');
  await writeFile(join(staticFiles, "tsconfig.build.json"), '{ "compilerOptions": {} }\n');
  await writeFile(join(staticFiles, ".env.json"), '{ "SECRET": "must-not-ship" }\n');
  await writeFile(join(staticFiles, "notes.md"), "# Notes\n");
  await writeFile(join(staticFiles, "source.ts"), "export const leaked = true;\n");
  await writeFile(join(staticFiles, "app.js.map"), '{ "version": 3 }\n');
  await mkdir(join(staticFiles, ".hidden-tree/nested"), { recursive: true });
  await writeFile(join(staticFiles, ".hidden-tree/nested/token.txt"), "must-not-ship\n");
  await writeFile(join(staticFiles, ".hidden-tree/notes.css"), "body { color: red; }\n");
  await writeFile(join(outside, "secret.txt"), "must-not-ship\n");
  await symlink(join(outside, "secret.txt"), join(staticFiles, "leak.txt"));
  await symlink(staticFiles, join(root, "linked-static"));

  const distRoot = join(root, "dist");
  await buildApp({
    name: "fixture",
    appRoot: root,
    distRoot,
    pages: { from: pages, to: "" },
    copies: [
      { from: staticFiles, to: "" },
      // A symlinked copy root is skipped rather than followed, even though its
      // target is inside the source tree.
      { from: join(root, "linked-static"), to: "linked" },
    ],
    scripts: [],
    origins: DEFAULTS,
    expectedPages: ["index.html"],
  });

  assert.deepEqual(await relativeFiles(distRoot), ["index.html", "keep.css", "keep.svg"]);

  const summary = await auditDist({ distRoot, origins: DEFAULTS, expectedPages: ["index.html"] });
  assert.deepEqual(summary.issues, []);
});

test("symlinked source roots are skipped, so a build cannot follow them", async (t) => {
  const root = await tempDir("syndroo-linked-roots-");
  t.after(() => rm(root, { recursive: true, force: true }));

  const realPages = join(root, "real/pages");
  const realStatic = join(root, "real/static");
  await mkdir(realPages, { recursive: true });
  await mkdir(realStatic, { recursive: true });
  await writeFile(
    join(realPages, "index.html"),
    '<!doctype html>\n<html lang="en">\n<head><title>Linked</title></head>\n<body><h1>Linked</h1></body>\n</html>\n',
  );
  await writeFile(join(realStatic, "keep.css"), "body { color: #000; }\n");
  await symlink(realPages, join(root, "linked-pages"));
  await symlink(realStatic, join(root, "linked-static"));

  const distRoot = join(root, "dist");
  await buildApp({
    name: "linked",
    appRoot: root,
    distRoot,
    pages: { from: join(root, "linked-pages"), to: "" },
    copies: [{ from: join(root, "linked-static"), to: "" }],
    scripts: [],
    origins: DEFAULTS,
    expectedPages: ["index.html"],
  });

  assert.deepEqual(await relativeFiles(distRoot), [], "nothing may be read through a symlinked root");

  const summary = await auditDist({ distRoot, origins: DEFAULTS, expectedPages: ["index.html"] });
  assert.ok(summary.issues.length > 0, "an empty output must be reported");
  assert.match(summary.issues.map((issue) => issue.message).join("\n"), /no build output found/);
});

test("the audit reports hidden files and symlinks that reach the output", async (t) => {
  const root = await tempDir("syndroo-audit-extras-");
  t.after(() => rm(root, { recursive: true, force: true }));

  const distRoot = join(root, "dist");
  const outside = join(root, "outside");
  await mkdir(join(distRoot, ".git"), { recursive: true });
  await mkdir(outside, { recursive: true });
  await writeFile(
    join(distRoot, "index.html"),
    '<!doctype html>\n<html lang="en">\n<head><title>Extras</title></head>\n<body><h1>Extras</h1></body>\n</html>\n',
  );
  await writeFile(join(distRoot, ".git/config"), "[core]\n");
  await writeFile(join(outside, "secret.txt"), "must-not-serve\n");
  await symlink(join(outside, "secret.txt"), join(distRoot, "escape.txt"));

  const summary = await auditDist({ distRoot, origins: DEFAULTS, expectedPages: ["index.html"] });
  const messages = summary.issues.map((issue) => `${issue.file}: ${issue.message}`).join("\n");

  assert.match(messages, /\.git\/config: hidden path in build output/);
  assert.match(messages, /escape\.txt: symlink in build output/);
});

test("the audit reports broken references, missing fragments and missing headings", async (t) => {
  const root = await tempDir("syndroo-audit-");
  t.after(() => rm(root, { recursive: true, force: true }));

  const pages = join(root, "src/pages");
  await mkdir(pages, { recursive: true });
  await writeFile(
    join(pages, "index.html"),
    [
      "<!doctype html>",
      '<html lang="en">',
      "<head><title>Broken fixture</title></head>",
      "<body>",
      "<p>This page has no heading.</p>",
      '<a href="/missing.html">missing file</a>',
      '<a href="#nope">missing fragment</a>',
      '<a href="javascript:alert(1)">inline script</a>',
      '<img src="/missing.png">',
      "</body>",
      "</html>",
      "",
    ].join("\n"),
  );

  const distRoot = join(root, "dist");
  await buildApp({
    name: "fixture",
    appRoot: root,
    distRoot,
    pages: { from: pages, to: "" },
    copies: [],
    scripts: [],
    origins: DEFAULTS,
    expectedPages: ["index.html", "absent.html"],
  });

  const summary = await auditDist({
    distRoot,
    origins: DEFAULTS,
    expectedPages: ["index.html", "absent.html"],
  });
  const messages = summary.issues.map((issue) => issue.message).join("\n");

  assert.match(messages, /missing\.html/);
  assert.match(messages, /#nope/);
  assert.match(messages, /javascript: URL/);
  assert.match(messages, /alt attribute/);
  assert.match(messages, /h1 element\(s\), expected exactly 1/);
  assert.ok(
    summary.issues.some(
      (issue) => issue.file === "absent.html" && issue.message.includes("expected page is missing"),
    ),
    "an expected page that is absent should be reported against its path",
  );
  assert.ok(summary.issues.every((issue) => issue.line === undefined || issue.line > 0));
});

test("the build CLI refuses an unsafe origin without touching the build output", async () => {
  const distRoot = join(repoRoot, "apps/website/dist");
  const before = await relativeFiles(distRoot);

  const failure = await execFileAsync(process.execPath, ["scripts/build.ts"], {
    cwd: repoRoot,
    env: { ...process.env, WEBSITE_ORIGIN: "https://www.example.com/marketing" },
  }).then(
    () => null,
    (error: { stderr?: string; code?: number }) => error,
  );

  assert.ok(failure !== null, "an origin with a path must fail the build");
  assert.match(String(failure.stderr), /WEBSITE_ORIGIN/);
  assert.deepEqual(await relativeFiles(distRoot), before, "a rejected build must not modify the output");
});
