// Build the documentation site into `apps/docs/dist`.
import { runAppBuild } from "../../scripts/lib/build-app.ts";
import { runCli } from "../../scripts/lib/cli.ts";
import { resolveOrigins } from "../../scripts/lib/origins.ts";
import { docsBuild } from "./app.config.ts";

await runCli("@syndroo/docs build", async () => {
  await runAppBuild(docsBuild(resolveOrigins(process.env)));
});
