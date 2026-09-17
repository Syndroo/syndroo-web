// Build the documentation site, then serve its output on the loopback origin.
import { runAppBuild } from "../../scripts/lib/build-app.ts";
import { runCli } from "../../scripts/lib/cli.ts";
import { DEFAULT_DOCS_PORT, DEFAULT_HOST, resolveOrigins } from "../../scripts/lib/origins.ts";
import { startStaticServer } from "../../scripts/lib/static-server.ts";
import { docsBuild } from "./app.config.ts";

await runCli("@syndroo/docs dev", async () => {
  const config = docsBuild(resolveOrigins(process.env));
  await runAppBuild(config);
  const server = await startStaticServer({
    label: "Documentation site",
    root: config.distRoot,
    host: DEFAULT_HOST,
    port: DEFAULT_DOCS_PORT,
  });
  console.log(`${server.label}: ${server.url}`);
  console.log("No file watcher: re-run `npm run build` after editing a source file.");
});
