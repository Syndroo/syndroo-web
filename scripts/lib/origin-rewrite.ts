// Rewrite the authored loopback origins to the configured pair after a build.
//
// The authored pages, content modules and client bundles keep the historical
// `localhost:4173` / `localhost:4174` placeholders, exactly as before this
// migration, and every build rewrites them in one pass over text output. The
// rewrite is a no-op when the configured pair is the default pair.
import { readFile, writeFile } from "node:fs/promises";
import { extensionOf, listFiles } from "./files.ts";
import { DEFAULT_DOCS_ORIGIN, DEFAULT_WEBSITE_ORIGIN, applyOrigins, type Origins } from "./origins.ts";

/** Text output a rewrite can safely touch. */
const REWRITABLE = new Set([".html", ".js", ".mjs", ".css", ".xml", ".txt", ".json", ".svg"]);

/** Rewrite one exported directory in place; returns how many files changed. */
export async function rewriteOriginsInDirectory(root: string, origins: Origins): Promise<number> {
  let changed = 0;

  for (const file of await listFiles(root)) {
    if (!REWRITABLE.has(extensionOf(file))) {
      continue;
    }
    const before = await readFile(file, "utf8");
    if (!before.includes(DEFAULT_WEBSITE_ORIGIN) && !before.includes(DEFAULT_DOCS_ORIGIN)) {
      continue;
    }
    const after = applyOrigins(before, origins);
    if (after !== before) {
      await writeFile(file, after, "utf8");
      changed += 1;
    }
  }

  return changed;
}
