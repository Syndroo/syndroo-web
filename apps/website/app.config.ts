// Build description for the marketing site.
//
// Page sources mirror onto the served paths, static files keep their original
// URLs (`/css/site.css`, `/assets/...`) and the client script is compiled to
// `/js/site.js`.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AppBuild } from "../../scripts/lib/build-app.ts";
import type { Origins } from "../../scripts/lib/origins.ts";
import { brandAssetsDir, contentDir } from "../../scripts/lib/paths.ts";
import { renderRobots, renderSitemap } from "../../scripts/lib/seo.ts";
import { websitePages as websitePageRegistry } from "../../packages/content/site-data.ts";

export const appRoot = dirname(fileURLToPath(import.meta.url));
export const defaultDistRoot = join(appRoot, "dist");

/** Built page paths, derived from the shared page registry. */
export const websitePages: string[] = websitePageRegistry.map((page) => page.file);

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
    scripts: [
      { from: join(appRoot, "src/js/site.ts"), to: join(distRoot, "js/site.js") },
      // The demo fixtures and metadata are shared with the docs build and the
      // tests; compiling the same source keeps one set of facts.
      {
        from: join(contentDir, "site-data.ts"),
        to: join(distRoot, "js/site-data.js"),
      },
      {
        from: join(contentDir, "demo-data.ts"),
        to: join(distRoot, "js/demo-data.js"),
      },
    ],
    generated: [
      { to: join(distRoot, "sitemap.xml"), render: (values) => renderSitemap(values.website, websitePageRegistry) },
      { to: join(distRoot, "robots.txt"), render: (values) => renderRobots(values.website) },
    ],
    origins,
    expectedPages: websitePages,
  };
}
