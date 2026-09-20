// Verify the exported output of both sites.
//
// Checks local links, fragments, ids, image alt text, English language, one
// `h1` per page, the configured origins, and that the exported HTML carries no
// server-only Next.js dependency. Run `npm run build` first: this checks
// artifacts, not sources.
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { promisify } from "node:util";
import { SITE_TARGETS } from "./lib/app-targets.ts";
import { auditDist } from "./lib/audit.ts";
import { runCli } from "./lib/cli.ts";
import { extensionOf, listFiles, toPosix } from "./lib/files.ts";
import { resolveOrigins } from "./lib/origins.ts";

const run = promisify(execFile);

/** Markers that would mean a page still depends on a Next.js server. */
const SERVER_DEPENDENCY_MARKERS: ReadonlyArray<readonly [string, string]> = [
  ["__NEXT_DATA__.buildId", "references the pages-router data payload"],
  ["/__nextjs_original-stack-frame", "references the Next.js development overlay"],
  ["_next/static/chunks/app/api/", "contains a server route chunk"],
];

await runCli("check", async () => {
  const origins = resolveOrigins(process.env);
  console.log(`check: website origin ${origins.website}, docs origin ${origins.docs}`);

  let issueCount = 0;

  for (const site of SITE_TARGETS) {
    const summary = await auditDist({
      distRoot: site.outRoot,
      origins,
      expectedPages: [...site.expectedPages],
    });

    console.log(
      `${site.name}: ${summary.files} file(s), ${summary.pages} page(s), ` +
        `${summary.references} local reference(s), ${summary.issues.length} issue(s)`,
    );
    for (const issue of summary.issues) {
      const where = issue.line === undefined ? issue.file : `${issue.file}:${issue.line}`;
      console.log(`  issue ${where}: ${issue.message}`);
    }
    issueCount += summary.issues.length;

    for (const file of await listFiles(site.outRoot)) {
      const name = toPosix(relative(site.outRoot, file));
      const extension = extensionOf(file);

      if (extension === ".js" || extension === ".mjs") {
        try {
          await run(process.execPath, ["--check", file]);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.log(`  issue ${name}: could not parse generated script - ${message}`);
          issueCount += 1;
        }
      }

      if (extension !== ".html") {
        continue;
      }
      const html = await readFile(file, "utf8");
      for (const [marker, message] of SERVER_DEPENDENCY_MARKERS) {
        if (html.includes(marker)) {
          console.log(`  issue ${name}: ${message}`);
          issueCount += 1;
        }
      }
    }
  }

  if (issueCount > 0) {
    throw new Error(`${issueCount} issue(s) found in the exported output`);
  }
  console.log("check: exported output is internally consistent, server-free and matches the configured origins");
});
