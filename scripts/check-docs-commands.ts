// Check that every `syndroo` command and `--flag` the documentation introduces
// exists in the real CLI.
//
// The CLI ships from the product repository, so this runs against a checkout at
// `../syndroo` by default, or at `SYNDROO_CORE_REPO`, or at the exact entry
// point in `SYNDROO_CLI_BIN`. Run `npm run build` first: this reads the exported
// documentation, not the sources.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { SITE_TARGETS } from "./lib/app-targets.ts";
import { runCli } from "./lib/cli.ts";
import { checkCliContract, resolveCliBin } from "./lib/docs-cli-contract.ts";
import { listFiles } from "./lib/files.ts";
import { repoRoot } from "./lib/paths.ts";
import { docsPages, versions } from "../packages/content/site-data.ts";

const CORE_REPO = process.env.SYNDROO_CORE_REPO ?? resolve(repoRoot, "..", "syndroo");

await runCli("check:docs-commands", async () => {
  const cliBin = resolveCliBin(CORE_REPO);

  if (!existsSync(cliBin)) {
    throw new Error(
      `no CLI found at ${cliBin}. Build it with "npm run build" in the product repository, ` +
        "or set SYNDROO_CORE_REPO / SYNDROO_CLI_BIN to point at one.",
    );
  }

  const docsSite = SITE_TARGETS.find((site) => site.name === "@syndroo/docs");
  if (docsSite === undefined) {
    throw new Error("the docs site target is missing from the build configuration");
  }
  if ((await listFiles(docsSite.outRoot)).length === 0) {
    throw new Error(`${docsSite.outRoot} has no export; run \`npm run build\` first`);
  }

  const pages: { path: string; html: string }[] = [];
  for (const page of docsPages) {
    pages.push({ path: page.path, html: await readFile(join(docsSite.outRoot, page.file), "utf8") });
  }

  const issues = await checkCliContract({ cliBin, pages, expectedVersion: versions.cli });
  console.log(
    `check:docs-commands: ${pages.length} page(s) checked against ${cliBin} (CLI ${versions.cli})`,
  );

  for (const issue of issues) {
    console.log(`  issue ${issue}`);
  }

  if (issues.length > 0) {
    throw new Error(`${issues.length} documented CLI claim(s) do not exist in the CLI`);
  }

  console.log("check:docs-commands: every documented command, flag and version exists in the CLI");
});
