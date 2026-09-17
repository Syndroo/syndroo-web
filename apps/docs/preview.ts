// Serve the existing documentation build; never builds.
import { runCli } from "../../scripts/lib/cli.ts";
import { listFiles } from "../../scripts/lib/files.ts";
import { DEFAULT_DOCS_PORT, DEFAULT_HOST, resolveOrigins } from "../../scripts/lib/origins.ts";
import { startStaticServer } from "../../scripts/lib/static-server.ts";
import { docsBuild } from "./app.config.ts";

await runCli("@syndroo/docs preview", async () => {
  const config = docsBuild(resolveOrigins(process.env));
  if ((await listFiles(config.distRoot)).length === 0) {
    throw new Error(`${config.distRoot} is empty; run \`npm run build\` first`);
  }
  const server = await startStaticServer({
    label: "Documentation site",
    root: config.distRoot,
    host: DEFAULT_HOST,
    port: DEFAULT_DOCS_PORT,
  });
  console.log(`${server.label}: ${server.url}`);
});
