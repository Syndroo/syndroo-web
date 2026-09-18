// Build description for the documentation site.
//
// The docs origin has its own layout: pages mirror onto the served paths,
// `/styles.css` keeps its original URL and the client script is compiled to
// `/doc.js`. Each page declares two chrome markers that become the shared
// navigation, footer and search dialog, and every page appears in the sitemap.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AppBuild } from "../../scripts/lib/build-app.ts";
import type { Origins } from "../../scripts/lib/origins.ts";
import { brandAssetsDir, contentDir } from "../../scripts/lib/paths.ts";
import { renderRobots, renderSitemap } from "../../scripts/lib/seo.ts";
import { docsPages as docsPageRegistry } from "../../packages/content/site-data.ts";
import { renderDocsFoot, renderDocsHead } from "./src/chrome.ts";

export const appRoot = dirname(fileURLToPath(import.meta.url));
export const defaultDistRoot = join(appRoot, "dist");

/** Built page paths, derived from the shared page registry. */
export const docsPages: string[] = docsPageRegistry.map((page) => page.file);

const HEAD_MARKER = "<!-- docs:head -->";
const FOOT_MARKER = "<!-- docs:foot -->";

/**
 * Replace the two chrome markers with the shared topbar, sidebar, footer and
 * search dialog. A page that loses a marker fails the build instead of shipping
 * without navigation.
 */
function expandChrome(relativePath: string, text: string): string {
  const page = docsPageRegistry.find((entry) => entry.file === relativePath);
  if (!page) {
    throw new Error(
      `docs page ${relativePath} is missing from the page registry in packages/content/site-data.ts`,
    );
  }
  if (!text.includes(HEAD_MARKER) || !text.includes(FOOT_MARKER)) {
    throw new Error(`docs page ${relativePath} must declare ${HEAD_MARKER} and ${FOOT_MARKER}`);
  }
  return text.replace(HEAD_MARKER, renderDocsHead(page.path)).replace(FOOT_MARKER, renderDocsFoot());
}

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
    scripts: [
      { from: join(appRoot, "src/js/doc.ts"), to: join(distRoot, "doc.js") },
      // The page registry that drives search and the sidebar is the same source
      // the website build and the tests read.
      { from: join(contentDir, "site-data.ts"), to: join(distRoot, "site-data.js") },
    ],
    generated: [
      { to: join(distRoot, "sitemap.xml"), render: (values) => renderSitemap(values.docs, docsPageRegistry) },
      { to: join(distRoot, "robots.txt"), render: (values) => renderRobots(values.docs) },
    ],
    transformPage: expandChrome,
    origins,
    expectedPages: docsPages,
  };
}
