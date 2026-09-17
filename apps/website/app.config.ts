// Build description for the marketing site.
//
// Page sources mirror onto the served paths, static files keep their original
// URLs (`/css/site.css`, `/assets/...`) and the client script is compiled to
// `/js/site.js`.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AppBuild } from "../../scripts/lib/build-app.ts";
import type { Origins } from "../../scripts/lib/origins.ts";
import { brandAssetsDir } from "../../scripts/lib/paths.ts";

export const appRoot = dirname(fileURLToPath(import.meta.url));
export const defaultDistRoot = join(appRoot, "dist");

export const websitePages: string[] = [
  "index.html",
  "about/index.html",
  "blog/index.html",
  "blog/safe-cross-posting-with-idempotency/index.html",
  "changelog/index.html",
  "privacy/index.html",
  "terms/index.html",
];

export function websiteBuild(
  origins: Origins,
  distRoot: string = defaultDistRoot,
): AppBuild {
  return {
    name: "@syndroo/website",
    appRoot,
    distRoot,
    pages: { from: join(appRoot, "src/pages"), to: "" },
    copies: [
      { from: join(appRoot, "src/static"), to: "" },
      { from: brandAssetsDir, to: "assets" },
    ],
    scripts: [{ from: join(appRoot, "src/js/site.ts"), to: join(distRoot, "js/site.js") }],
    origins,
    expectedPages: websitePages,
  };
}
