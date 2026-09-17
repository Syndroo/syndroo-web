// Build the marketing site into `apps/website/dist`.
import { runAppBuild } from "../../scripts/lib/build-app.ts";
import { runCli } from "../../scripts/lib/cli.ts";
import { resolveOrigins } from "../../scripts/lib/origins.ts";
import { websiteBuild } from "./app.config.ts";

await runCli("@syndroo/website build", async () => {
  await runAppBuild(websiteBuild(resolveOrigins(process.env)));
});
