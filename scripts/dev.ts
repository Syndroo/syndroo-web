// Build both sites once, then serve both built outputs on loopback.
//
// There is no file watcher: edit a source, run the build again, then reload.
import { runAppBuild } from "./lib/build-app.ts";
import { runCli } from "./lib/cli.ts";
import {
  DEFAULT_DOCS_PORT,
  DEFAULT_HOST,
  DEFAULT_WEBSITE_PORT,
  resolveOrigins,
} from "./lib/origins.ts";
import { closeOnShutdown, startStaticServers } from "./lib/static-server.ts";
import { docsBuild } from "../apps/docs/app.config.ts";
import { websiteBuild } from "../apps/website/app.config.ts";

await runCli("dev", async () => {
  const origins = resolveOrigins(process.env);
  const website = websiteBuild(origins);
  const docs = docsBuild(origins);

  await runAppBuild(website);
  await runAppBuild(docs);

  // Started as one unit: a port already in use must not leave the other
  // listener running behind a failed command.
  const servers = await startStaticServers([
    {
      label: "Marketing site",
      root: website.distRoot,
      host: DEFAULT_HOST,
      port: DEFAULT_WEBSITE_PORT,
    },
    {
      label: "Documentation site",
      root: docs.distRoot,
      host: DEFAULT_HOST,
      port: DEFAULT_DOCS_PORT,
    },
  ]);

  for (const server of servers) {
    console.log(`${server.label}: ${server.url} (serving ${server.root})`);
  }
  console.log(`Cross-site links: marketing -> ${origins.website}, docs -> ${origins.docs}`);
  console.log("No file watcher: re-run `npm run build` after editing a source file, then reload.");

  closeOnShutdown(servers);
  await new Promise(() => {});
});
