// Serve the exported builds of both sites on loopback. Never builds.
import { SITE_TARGETS } from "./lib/app-targets.ts";
import { runCli } from "./lib/cli.ts";
import { listFiles } from "./lib/files.ts";
import { DEFAULT_HOST, resolveOrigins } from "./lib/origins.ts";
import { closeOnShutdown, startStaticServers } from "./lib/static-server.ts";

await runCli("preview", async () => {
  const origins = resolveOrigins(process.env);

  for (const site of SITE_TARGETS) {
    if ((await listFiles(site.outRoot)).length === 0) {
      throw new Error(`${site.name} has no export at ${site.outRoot}; run \`npm run build\` first`);
    }
  }

  // Started as one unit: an occupied port must not leave the other listener
  // running behind a failed command.
  const servers = await startStaticServers(
    SITE_TARGETS.map((site) => ({
      label: site.name,
      root: site.outRoot,
      host: DEFAULT_HOST,
      port: site.port,
    })),
  );

  for (const server of servers) {
    console.log(`${server.label}: ${server.url} (serving ${server.root})`);
  }
  console.log(`Cross-site links: marketing -> ${origins.website}, docs -> ${origins.docs}`);
  console.log("Serving existing output; re-run `npm run build` to pick up source changes.");

  closeOnShutdown(servers);
  await new Promise(() => {});
});
