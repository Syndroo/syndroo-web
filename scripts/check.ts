// Verify the built output of both sites.
//
// Checks local links, sources, fragments, ids, image alt text, English language,
// one `h1` per page, the configured origins, and the syntax of the generated
// browser scripts. Run `npm run build` first: this checks artifacts, not sources.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { relative } from "node:path";
import { auditDist } from "./lib/audit.ts";
import { runCli } from "./lib/cli.ts";
import { extensionOf, listFiles, toPosix } from "./lib/files.ts";
import { resolveOrigins } from "./lib/origins.ts";
import { docsBuild } from "../apps/docs/app.config.ts";
import { websiteBuild } from "../apps/website/app.config.ts";

const run = promisify(execFile);

await runCli("check", async () => {
  const origins = resolveOrigins(process.env);
  console.log(`check: website origin ${origins.website}, docs origin ${origins.docs}`);
  console.log("check: type stripping is not a type check; this inspects built output");

  const apps = [websiteBuild(origins), docsBuild(origins)];
  let issueCount = 0;

  for (const config of apps) {
    const summary = await auditDist({
      distRoot: config.distRoot,
      origins,
      expectedPages: config.expectedPages,
    });

    console.log(
      `${config.name}: ${summary.files} file(s), ${summary.pages} page(s), ` +
        `${summary.references} local reference(s), ${summary.issues.length} issue(s)`,
    );

    for (const issue of summary.issues) {
      const where = issue.line === undefined ? issue.file : `${issue.file}:${issue.line}`;
      console.log(`  issue ${where}: ${issue.message}`);
    }
    issueCount += summary.issues.length;

    for (const file of await listFiles(config.distRoot)) {
      const extension = extensionOf(file);
      if (extension !== ".js" && extension !== ".mjs") {
        continue;
      }
      const name = toPosix(relative(config.distRoot, file));
      try {
        await run(process.execPath, ["--check", file]);
        console.log(`  ${name}: syntax ok`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`  issue ${name}: could not parse generated script - ${message}`);
        issueCount += 1;
      }
    }
  }

  if (issueCount > 0) {
    throw new Error(`${issueCount} issue(s) found in the built output`);
  }
  console.log("check: built output is internally consistent and matches the configured origins");
});
