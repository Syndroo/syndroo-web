// Serve the existing marketing build; never builds.
import { runCli } from "../../scripts/lib/cli.ts";
import { listFiles } from "../../scripts/lib/files.ts";
import { DEFAULT_HOST, DEFAULT_WEBSITE_PORT, resolveOrigins } from "../../scripts/lib/origins.ts";
import { startStaticServer } from "../../scripts/lib/static-server.ts";
import { websiteBuild } from "./app.config.ts";

await runCli("@syndroo/website preview", async () => {
  const config = websiteBuild(resolveOrigins(process.env));
  if ((await listFiles(config.distRoot)).length === 0) {
    throw new Error(`${config.distRoot} is empty; run \`npm run build\` first`);
  }
  const server = await startStaticServer({
    label: "Marketing site",
    root: config.distRoot,
    host: DEFAULT_HOST,
    port: DEFAULT_WEBSITE_PORT,
  });
  console.log(`${server.label}: ${server.url}`);
});
