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
import { checkCliContract, extractCliSurface, resolveCliBin } from "../scripts/lib/docs-cli-contract.ts";
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

test("the documentation spells its CLI commands in a form this checker can read", async () => {
  const surface = extractCliSurface(await docsExport());

  assert.ok(
    surface.invocations.length >= 8,
    `expected the docs to show several invocations, saw ${surface.invocations.length}`,
  );

  const commands = new Set(surface.invocations.map((entry) => entry.command));
  for (const command of [
    "doctor",
    "posts validate",
    "posts create",
    "posts list",
    "posts get",
    "posts wait",
    "skill path",
  ]) {
    assert.ok(commands.has(command), `the documentation should show "syndroo ${command}"`);
  }

  // A flag counts as documented when it appears on a command line or as its own
  // inline code span; the two spellings are both used on purpose.
  const flags = new Set([
    ...surface.inlineFlags.map((entry) => entry.flag),
    ...surface.invocations.flatMap((entry) => entry.flags),
  ]);
  for (const flag of [
    "--json",
    "--yes",
    "--file",
    "--idempotency-key",
    "--timeout",
    "--limit",
    "--base-url",
    "--dry-run",
  ]) {
    assert.ok(flags.has(flag), `the documentation should explain ${flag}`);
  }

  assert.ok(
    surface.inlineFlags.length >= 4,
    "the prose should name the flags it explains, not only the command lines",
  );
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
