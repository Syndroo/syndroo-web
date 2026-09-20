// Build-time origins for the marketing site.
//
// The authored pages keep the historical loopback links and every build
// rewrites them to the configured pair, exactly as the previous build did.
// The defaults in scripts/lib/origins.ts are the same values; a fixture test
// asserts that.
export const DEFAULT_WEBSITE_ORIGIN = "http://localhost:4173";
export const DEFAULT_DOCS_ORIGIN = "http://localhost:4174";

/** The origin this site is being built for. */
export function websiteOrigin(): string {
  const raw = process.env.WEBSITE_ORIGIN;
  return raw === undefined || raw === "" ? DEFAULT_WEBSITE_ORIGIN : raw;
}
