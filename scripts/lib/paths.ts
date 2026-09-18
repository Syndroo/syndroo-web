// Filesystem anchors shared by every script and app build.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * The single shared asset tree: logo, favicon, the three mascot artworks and the
 * five platform marks. Both builds copy it to their own `/assets/` directory.
 */
export const brandAssetsDir = resolve(repoRoot, "packages/brand/assets");

/**
 * Shared content modules. Both app builds compile the same sources into their
 * own output, so the two sites and the tests cannot disagree about versions,
 * platform status, navigation or demo fixtures.
 */
export const contentDir = resolve(repoRoot, "packages/content");
