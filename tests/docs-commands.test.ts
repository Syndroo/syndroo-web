// Command-existence fixtures for the documentation.
//
// The documentation is allowed to teach a `syndroo` command or a `--flag` only
// when the real CLI accepts it. The CLI ships from the product repository, so
// these fixtures read the exported documentation and then run the CLI's own
// `--help` and `version` output. When no checkout is reachable the fixture is
// reported as skipped rather than passed.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { SITE_TARGETS } from "../scripts/lib/app-targets.ts";
import {
  ACCEPTED_LEAF_COMMANDS,
  ACCEPTED_COMMANDS,
  ACCEPTED_GLOBAL_FLAGS,
  RETIRED_COMMANDS,
  allDocumentedFlags,
  checkCliContract,
  documentedFlagsFor,
  extractCliSurface,
  parentFlagsFor,
  resolveCliBin,
} from "../scripts/lib/docs-cli-contract.ts";
import { listFiles } from "../scripts/lib/files.ts";
import { repoRoot } from "../scripts/lib/paths.ts";
import { docsPages, versions } from "../packages/content/site-data.ts";

const CORE_REPO = process.env.SYNDROO_CORE_REPO ?? resolve(repoRoot, "..", "syndroo");

/** The CLI's own help only; it never runs a documented example. */
const runCliHelp = promisify(execFile);

async function docsExport(): Promise<{ path: string; html: string }[]> {
  const docsSite = SITE_TARGETS.find((site) => site.name === "@syndroo/docs");
  assert.ok(docsSite, "the docs site target should exist");
  if ((await listFiles(docsSite.outRoot)).length === 0) {
    throw new Error(`${docsSite.outRoot} has no export; run \`npm run build\` first`);
  }

  const pages: { path: string; html: string }[] = [];
  for (const page of docsPages) {
    pages.push({ path: page.path, html: await readFile(join(docsSite.outRoot, page.file), "utf8") });
  }
  return pages;
}

test("the documentation prints only the accepted v1 command surface", async () => {
  const surface = extractCliSurface(await docsExport());

  assert.ok(
    surface.invocations.length >= 12,
    `expected the docs to show several invocations, saw ${surface.invocations.length}`,
  );

  const commands = new Set(surface.invocations.map((entry) => entry.command));
  for (const command of ACCEPTED_LEAF_COMMANDS) {
    assert.ok(commands.has(command), `the documentation should show "syndroo ${command}"`);
  }
  for (const command of commands) {
    assert.ok(
      ACCEPTED_COMMANDS.includes(command),
      `"syndroo ${command}" is not on the accepted command surface`,
    );
  }

  // A retired family may not survive anywhere on the page, not even in prose.
  assert.deepEqual(
    surface.retired,
    [],
    `retired command families still reach a reader: ${JSON.stringify(surface.retired)}`,
  );
  assert.ok(RETIRED_COMMANDS.includes("doctor"), "the retired list should still name the old families");

  // A flag counts as documented when it appears on a command line or as its own
  // inline code span; the two spellings are both used on purpose.
  const flags = new Set([
    ...surface.inlineFlags.map((entry) => entry.flag),
    ...surface.invocations.flatMap((entry) => entry.flags),
  ]);
  for (const flag of [
    "--json",
    "--config",
    "--dry-run",
    "--yes",
    "--input",
    "--data",
    "--retry",
    "--to",
    "--limit",
    "--from-env",
  ]) {
    assert.ok(flags.has(flag), `the documentation should explain ${flag}`);
  }

  assert.ok(
    surface.inlineFlags.length >= 4,
    "the prose should name the flags it explains, not only the command lines",
  );

  // Every mentioned flag has to belong to the surface it is used with.
  const allowedWhenStandalone = new Set(allDocumentedFlags());
  for (const { flag } of surface.inlineFlags) {
    assert.ok(allowedWhenStandalone.has(flag), `${flag} is not on the accepted surface`);
  }
  for (const invocation of surface.invocations) {
    const allowed = new Set([
      ...ACCEPTED_GLOBAL_FLAGS,
      ...documentedFlagsFor(invocation.command),
      ...parentFlagsFor(invocation.command),
    ]);
    for (const flag of invocation.flags) {
      assert.ok(
        allowed.has(flag),
        `${flag} is not documented for "syndroo ${invocation.command}"`,
      );
    }
  }
});

test("nested Server commands and npx --no-install invocations are parsed exactly", () => {
  const surface = extractCliSurface([
    {
      path: "/fixture/",
      html:
        "<pre><code>npx --no-install syndroo server connect threads \\\n" +
        "  --app-id &lt;app-id&gt;\n" +
        "npx --no-install syndroo server ci setup github --repo owner/repo</code></pre>",
    },
  ]);

  assert.deepEqual(surface.invocations, [
    {
      command: "server connect threads",
      flags: ["--app-id"],
      page: "/fixture/",
    },
    {
      command: "server ci setup github",
      flags: ["--repo"],
      page: "/fixture/",
    },
  ]);
});

test("an inline flag is read with or without its argument shape, and never after a negation", () => {
  const cases: { name: string; html: string; expected: string[] }[] = [
    { name: "a bare flag", html: "<p>Pass <code>--yes</code> to confirm.</p>", expected: ["--yes"] },
    {
      name: "a flag with its argument",
      html: "<p><code>--timeout &lt;duration&gt;</code> bounds a run or a verification.</p>",
      expected: ["--timeout"],
    },
    {
      name: "a negated flag",
      html: "<p>There is no <code>--api-key</code> flag.</p>",
      expected: [],
    },
    {
      name: "a negated flag with an argument",
      html: "<p>This command has no <code>--base-url &lt;origin&gt;</code> option.</p>",
      expected: [],
    },
    {
      name: "a Chinese negated flag with an argument",
      html: "<p>这个命令没有 <code>--base-url &lt;origin&gt;</code> 选项。</p>",
      expected: [],
    },
    {
      name: "only the negated occurrence is skipped",
      html:
        "<p>Pass <code>--yes</code> to confirm.</p>" +
        "<p>There is no <code>--api-key</code> flag.</p>",
      expected: ["--yes"],
    },
    {
      name: "Chinese positive documentation is still validated",
      html: "<p>传入 <code>--yes</code> 确认。</p><p>未提供 <code>--config</code> 时使用默认配置。</p>",
      expected: ["--yes", "--config"],
    },
    // A whole command in prose is an invocation, not an inline flag claim.
    { name: "a prose command", html: "<p>Run <code>syndroo help</code> for usage.</p>", expected: [] },
  ];

  for (const { name, html, expected } of cases) {
    const surface = extractCliSurface([{ path: "/fixture/", html }]);
    assert.deepEqual(
      surface.inlineFlags.map((entry) => entry.flag),
      expected,
      `${name} should yield ${JSON.stringify(expected)}`,
    );
  }
});

test("every documented command and flag exists in the real CLI", async (context) => {
  const cliBin = resolveCliBin(CORE_REPO);

  if (!existsSync(cliBin)) {
    context.skip(
      `no CLI at ${cliBin}; set SYNDROO_CORE_REPO or SYNDROO_CLI_BIN, and build the product repository`,
    );
    return;
  }

  const issues = await checkCliContract({
    cliBin,
    pages: await docsExport(),
    expectedVersion: versions.cli,
  });

  assert.deepEqual(
    issues,
    [],
    "the documentation must not describe a command, flag or version the CLI does not have",
  );
});

test("the real CLI checks exact nested paths and per-subcommand flags", async (context) => {
  const cliBin = resolveCliBin(CORE_REPO);

  if (!existsSync(cliBin)) {
    context.skip(`no CLI at ${cliBin}; set SYNDROO_CORE_REPO or SYNDROO_CLI_BIN`);
    return;
  }

  const check = (source: string) =>
    checkCliContract({
      cliBin,
      pages: [{ path: "/fixture/", html: `<pre><code>${source}</code></pre>` }],
      expectedVersion: versions.cli,
    });

  assert.deepEqual(await check("syndroo server doctor"), []);
  assert.match(
    (await check("syndroo server recreate")).join("\n"),
    /not on the accepted command surface/,
  );
  assert.match(
    (await check("syndroo server doctor --yes")).join("\n"),
    /"--yes" on "syndroo server doctor"/,
  );

  // `--project` is a declared value-taking option of `server`. The installed CLI
  // accepts it before the subcommand and after it, and both placements must keep
  // the leaf command and its own flags. Neither may widen the accepted surface:
  // an unknown child, an unknown flag and `--project` on a local command stay
  // rejected.
  const scoped = await checkCliContract({
    cliBin,
    pages: [
      {
        path: "/accepted-group/",
        html: "<pre><code>syndroo server --project . connect threads --app-id 123</code></pre>",
      },
      {
        path: "/accepted-equals/",
        html:
          "<pre><code>syndroo server --project=. publish threads " +
          "--input posts/hello.json --yes</code></pre>",
      },
      {
        path: "/accepted-leaf/",
        html: "<pre><code>syndroo server connect threads --project . --app-id 123</code></pre>",
      },
      {
        path: "/rejected-child/",
        html: "<pre><code>syndroo server --project . recreate</code></pre>",
      },
      {
        path: "/rejected-flag/",
        html: "<pre><code>syndroo server --project . connect threads --bogus</code></pre>",
      },
      {
        path: "/rejected-local/",
        html: "<pre><code>syndroo publish --project .</code></pre>",
      },
    ],
    expectedVersion: versions.cli,
  });

  const issuesFor = (path: string) => scoped.filter((issue) => issue.startsWith(path));

  for (const path of ["/accepted-group/", "/accepted-equals/", "/accepted-leaf/"]) {
    assert.deepEqual(issuesFor(path), [], `${path} documents a supported project scope`);
  }
  assert.match(
    issuesFor("/rejected-child/").join("\n"),
    /not on the accepted command surface/,
  );
  assert.match(
    issuesFor("/rejected-flag/").join("\n"),
    /"--bogus" on "syndroo server connect threads"/,
  );
  assert.match(
    issuesFor("/rejected-local/").join("\n"),
    /"--project" on "syndroo publish"/,
  );

  // Both placements really are accepted by the installed CLI. Help is printed
  // before a project is read, so neither probe runs a command.
  for (const args of [
    ["server", "--project", ".", "connect", "threads"],
    ["server", "connect", "threads", "--project", "."],
  ]) {
    const { stdout, stderr } = await runCliHelp(process.execPath, [cliBin, ...args, "--help"]);
    assert.match(`${stdout}${stderr}`, /Usage: syndroo server connect threads/);
  }
});

test("a declared project scope keeps the leaf command and its flags", () => {
  const surface = extractCliSurface([
    {
      path: "/fixture/",
      html:
        "<pre><code>" +
        "syndroo server --project . connect threads --app-id &lt;app-id&gt;\n" +
        "syndroo server --project=. publish threads --input posts/hello.json --yes\n" +
        "syndroo server --project ./syndroo-site deploy --yes\n" +
        "syndroo server connect threads --project . --app-id &lt;app-id&gt;" +
        "</code></pre>",
    },
  ]);

  assert.deepEqual(surface.invocations, [
    { command: "server connect threads", flags: ["--project", "--app-id"], page: "/fixture/" },
    { command: "server publish threads", flags: ["--project", "--input", "--yes"], page: "/fixture/" },
    { command: "server deploy", flags: ["--project", "--yes"], page: "/fixture/" },
    { command: "server connect threads", flags: ["--project", "--app-id"], page: "/fixture/" },
  ]);

  // The scope is not a way to smuggle in another command or a local flag.
  const rejected = extractCliSurface([
    {
      path: "/fixture/",
      html:
        "<pre><code>syndroo server --project . recreate\n" +
        "syndroo publish --project .</code></pre>",
    },
  ]);

  assert.deepEqual(rejected.invocations, [
    { command: "server recreate", flags: ["--project"], page: "/fixture/" },
    { command: "publish", flags: ["--project"], page: "/fixture/" },
  ]);
  assert.ok(
    !ACCEPTED_COMMANDS.includes(rejected.invocations[0]?.command ?? ""),
    "an unknown child command stays off the accepted surface",
  );
});
