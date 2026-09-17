// Serve the existing builds of both sites on loopback. Never builds.
import { runCli } from "./lib/cli.ts";
import { listFiles } from "./lib/files.ts";
import {
  DEFAULT_DOCS_PORT,
  DEFAULT_HOST,
  DEFAULT_WEBSITE_PORT,
  resolveOrigins,
} from "./lib/origins.ts";
import { closeOnShutdown, startStaticServers } from "./lib/static-server.ts";
import { docsBuild } from "../apps/docs/app.config.ts";
import { websiteBuild } from "../apps/website/app.config.ts";

await runCli("preview", async () => {
  const origins = resolveOrigins(process.env);
  const website = websiteBuild(origins);
  const docs = docsBuild(origins);

  for (const config of [website, docs]) {
    if ((await listFiles(config.distRoot)).length === 0) {
      throw new Error(`${config.name} has no build output at ${config.distRoot}; run \`npm run build\` first`);
    }
  }

  // Started as one unit: an occupied port must not leave the other listener
  // running behind a failed command.
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
  console.log("Serving existing output; re-run `npm run build` to pick up source changes.");

  closeOnShutdown(servers);
  await new Promise(() => {});
});
