// Build-time origins for the documentation site. The defaults match
// scripts/lib/origins.ts, and every build rewrites the authored loopback links
// to the configured pair.
export const DEFAULT_WEBSITE_ORIGIN = "http://localhost:4173";
export const DEFAULT_DOCS_ORIGIN = "http://localhost:4174";

/** The origin this site is being built for. */
export function docsOrigin(): string {
  const raw = process.env.DOCS_ORIGIN;
  return raw === undefined || raw === "" ? DEFAULT_DOCS_ORIGIN : raw;
}
