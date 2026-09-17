// Build both sites into `apps/<app>/dist`.
import { runAppBuild } from "./lib/build-app.ts";
import { runCli } from "./lib/cli.ts";
import { resolveOrigins } from "./lib/origins.ts";
import { docsBuild } from "../apps/docs/app.config.ts";
import { websiteBuild } from "../apps/website/app.config.ts";

await runCli("build", async () => {
  const origins = resolveOrigins(process.env);
  console.log(`build: website origin ${origins.website}, docs origin ${origins.docs}`);
  await runAppBuild(websiteBuild(origins));
  await runAppBuild(docsBuild(origins));
});
