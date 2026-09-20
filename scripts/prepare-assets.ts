// Copy the shared brand assets into each app's `public/` directory.
//
// The single source of truth stays packages/brand/assets (the logo, favicon,
// mascot artworks and platform marks are not redrawn). The copies are build
// inputs and are ignored by git.
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { brandAssetsDir, repoRoot } from "./lib/paths.ts";

export const APP_ROOT_DIRS: ReadonlyArray<string> = [
  join(repoRoot, "apps/website"),
  join(repoRoot, "apps/docs"),
];

/** Copy the shared brand assets into every app's `public/assets/`. */
export async function prepareAssets(): Promise<void> {
  for (const appRoot of APP_ROOT_DIRS) {
    const target = join(appRoot, "public/assets");
    await rm(target, { recursive: true, force: true });
    await mkdir(target, { recursive: true });
    await cp(brandAssetsDir, target, { recursive: true });
    console.log(`assets: ${brandAssetsDir} -> ${target}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await prepareAssets();
}
