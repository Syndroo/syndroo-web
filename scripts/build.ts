// Build both static sites with Next.js and rewrite the authored origins.
//
// Each app exports to its own `out/` directory and depends only on its own
// files, so either site can be deployed without the other.
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { SITE_TARGETS } from "./lib/app-targets.ts";
import { runCli } from "./lib/cli.ts";
import { resetDirectory } from "./lib/files.ts";
import { rewriteOriginsInDirectory } from "./lib/origin-rewrite.ts";
import { resolveOrigins } from "./lib/origins.ts";
import { repoRoot } from "./lib/paths.ts";
import { prepareAssets } from "./prepare-assets.ts";

const nextBin = join(repoRoot, "node_modules/next/dist/bin/next");

/**
 * Refuse to build next to a real environment file.
 *
 * Next.js loads `.env*` files on its own, and nothing in this repository needs
 * one: the only build input is the origin pair. Failing loudly keeps the
 * "no credentials at build time" rule enforceable instead of aspirational.
 */
async function assertNoEnvironmentFiles(): Promise<void> {
  const roots = [repoRoot, ...SITE_TARGETS.map((site) => site.appRoot)];
  for (const root of roots) {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (!entry.isFile() || entry.name === ".env.example") {
        continue;
      }
      if (entry.name === ".env" || entry.name.startsWith(".env.") || entry.name.startsWith(".dev.vars")) {
        throw new Error(
          `refusing to build while ${join(root, entry.name)} exists: the build must not read credentials or environment files`,
        );
      }
    }
  }
}

async function runNextBuild(cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  await new Promise<void>((done, fail) => {
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd,
      env,
      stdio: ["ignore", "inherit", "inherit"],
    });
    child.once("error", fail);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        done();
        return;
      }
      fail(new Error(`next build failed in ${cwd} (exit ${code ?? `signal ${signal}`})`));
    });
  });
}

await runCli("build", async () => {
  const origins = resolveOrigins(process.env);
  console.log(`build: website ${origins.website}, docs ${origins.docs}`);

  await assertNoEnvironmentFiles();
  await prepareAssets();

  for (const site of SITE_TARGETS) {
    // Start from an empty `out/`: Next.js rewrites the files it generates but
    // leaves anything an earlier build or an earlier route set left behind, and
    // a removed page must not survive in the published output.
    await resetDirectory(site.outRoot);
    await runNextBuild(site.appRoot, {
      ...process.env,
      WEBSITE_ORIGIN: origins.website,
      DOCS_ORIGIN: origins.docs,
    });
    const rewritten = await rewriteOriginsInDirectory(site.outRoot, origins);
    console.log(`${site.name}: exported to out/ and rewrote ${rewritten} file(s) for ${site.origin(origins)}`);
  }

  console.log("build: both sites exported independently");
});
