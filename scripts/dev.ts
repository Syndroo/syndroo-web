// Development servers for both sites. Never used by the build.
import { spawn } from "node:child_process";
import { join } from "node:path";
import { SITE_TARGETS } from "./lib/app-targets.ts";
import { runCli } from "./lib/cli.ts";
import { repoRoot } from "./lib/paths.ts";
import { prepareAssets } from "./prepare-assets.ts";

const nextBin = join(repoRoot, "node_modules/next/dist/bin/next");
const DEV_PORTS = [3000, 3001];

await runCli("dev", async () => {
  await prepareAssets();

  const children = SITE_TARGETS.map((site, index) =>
    spawn(process.execPath, [nextBin, "dev", "-p", String(DEV_PORTS[index] ?? 3000 + index)], {
      cwd: site.appRoot,
      env: process.env,
      stdio: ["ignore", "inherit", "inherit"],
    }),
  );

  const stop = (): void => {
    for (const child of children) {
      child.kill("SIGTERM");
    }
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  await Promise.all(
    children.map(
      (child) =>
        new Promise<void>((done, fail) => {
          child.once("error", fail);
          child.once("exit", () => {
            stop();
            done();
          });
        }),
    ),
  );
});
