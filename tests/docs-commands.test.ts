// Command-existence fixtures for the documentation.
//
// The documentation is allowed to teach a `syndroo` command or a `--flag` only
// when the real CLI accepts it. The CLI ships from the product repository, so
// these fixtures read the exported documentation and then run the CLI's own
// `--help` and `version` output. When no checkout is reachable the fixture is
// reported as skipped rather than passed.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

import { SITE_TARGETS } from "../scripts/lib/app-targets.ts";
import {
  ACCEPTED_COMMANDS,
  ACCEPTED_GLOBAL_FLAGS,
  RETIRED_COMMANDS,
  allDocumentedFlags,
  checkCliContract,
  documentedFlagsFor,
  extractCliSurface,
  resolveCliBin,
} from "../scripts/lib/docs-cli-contract.ts";
import { listFiles } from "../scripts/lib/files.ts";
import { repoRoot } from "../scripts/lib/paths.ts";
import { docsPages, versions } from "../packages/content/site-data.ts";

const CORE_REPO = process.env.SYNDROO_CORE_REPO ?? resolve(repoRoot, "..", "syndroo");

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
  for (const command of ACCEPTED_COMMANDS) {
    assert.ok(commands.has(command), `the documentation should show "syndroo ${command}"`);
  }
  for (const command of commands) {
    assert.ok(
      ACCEPTED_COMMANDS.includes(command),
      `"syndroo ${command}" is not one of the three accepted commands`,
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
    const allowed = new Set([...ACCEPTED_GLOBAL_FLAGS, ...documentedFlagsFor(invocation.command)]);
    for (const flag of invocation.flags) {
      assert.ok(
        allowed.has(flag),
        `${flag} is not documented for "syndroo ${invocation.command}"`,
      );
    }
  }
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
