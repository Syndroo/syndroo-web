// Sitemap and robots.txt generation.
//
// Both files are rendered from the app's page registry and the resolved build
// origins, so a page cannot exist in the build without appearing in the sitemap,
// and neither file can drift to a stale host.
import type { PageEntry } from "../../packages/content/site-data.ts";

/**
 * Escape one value for XML text content. Origins are validated as bare
 * `scheme://host[:port]` values, so this is defensive: a page path or a future
 * query parameter still cannot break the document.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** A minimal sitemap: one canonical URL per page, no invented metadata. */
export function renderSitemap(origin: string, pages: PageEntry[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const page of pages) {
    lines.push("  <url>", `    <loc>${escapeXml(`${origin}${page.path}`)}</loc>`, "  </url>");
  }
  lines.push("</urlset>", "");
  return lines.join("\n");
}

/** Allow everything and point crawlers at the generated sitemap. */
export function renderRobots(origin: string): string {
  return ["User-agent: *", "Allow: /", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
}
