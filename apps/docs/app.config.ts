// Build description for the documentation site.
//
// The docs origin has its own layout: pages mirror onto the served paths,
// `/styles.css` keeps its original URL and the client script is compiled to
// `/doc.js`.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AppBuild } from "../../scripts/lib/build-app.ts";
import type { Origins } from "../../scripts/lib/origins.ts";
import { brandAssetsDir } from "../../scripts/lib/paths.ts";

export const appRoot = dirname(fileURLToPath(import.meta.url));
export const defaultDistRoot = join(appRoot, "dist");

export const docsPages: string[] = [
  "index.html",
  "quickstart/index.html",
  "api/index.html",
  "concepts/index.html",
];

export function docsBuild(
  origins: Origins,
  distRoot: string = defaultDistRoot,
): AppBuild {
  return {
    name: "@syndroo/docs",
    appRoot,
    distRoot,
    pages: { from: join(appRoot, "src/pages"), to: "" },
    copies: [
      { from: join(appRoot, "src/static"), to: "" },
      { from: brandAssetsDir, to: "assets" },
    ],
    scripts: [{ from: join(appRoot, "src/js/doc.ts"), to: join(distRoot, "doc.js") }],
    origins,
    expectedPages: docsPages,
  };
}
