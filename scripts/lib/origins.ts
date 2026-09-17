// Build-time origins.
//
// The marketing site and the documentation site link to each other by absolute
// URL, so built pages must know both origins. Authored HTML keeps the historical
// loopback defaults and every build rewrites them to the configured pair.

export const DEFAULT_WEBSITE_ORIGIN = "http://localhost:4173";
export const DEFAULT_DOCS_ORIGIN = "http://localhost:4174";

export const DEFAULT_WEBSITE_PORT = 4173;
export const DEFAULT_DOCS_PORT = 4174;
export const DEFAULT_HOST = "127.0.0.1";

export type Origins = {
  website: string;
  docs: string;
};

/** Parse one build-time origin, rejecting anything that is not a bare root origin. */
export function requireRootOrigin(name: string, raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `${name} must be an absolute http(s) origin such as https://www.example.com (received ${JSON.stringify(raw)})`,
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must use http:// or https:// (received ${JSON.stringify(raw)})`);
  }

  if (url.username !== "" || url.password !== "") {
    throw new Error(`${name} must not carry credentials`);
  }

  if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
    throw new Error(`${name} must not carry a path, query or fragment`);
  }

  if (url.hostname === "") {
    throw new Error(`${name} must name a host`);
  }

  return url.origin;
}

/** Resolve the origin pair from the environment, defaulting to the loopback pair. */
export function resolveOrigins(env: Record<string, string | undefined> = process.env): Origins {
  const websiteRaw = env.WEBSITE_ORIGIN;
  const docsRaw = env.DOCS_ORIGIN;

  const website =
    websiteRaw === undefined || websiteRaw === ""
      ? DEFAULT_WEBSITE_ORIGIN
      : requireRootOrigin("WEBSITE_ORIGIN", websiteRaw);
  const docs =
    docsRaw === undefined || docsRaw === ""
      ? DEFAULT_DOCS_ORIGIN
      : requireRootOrigin("DOCS_ORIGIN", docsRaw);

  if (website === docs) {
    throw new Error(`WEBSITE_ORIGIN and DOCS_ORIGIN must be distinct origins (both are ${website})`);
  }

  return { website, docs };
}

/**
 * Rewrite the authored cross-site links to the configured origin pair.
 *
 * The two original origins are replaced in a single pass over the source text.
 * Rewriting them one after another would cascade whenever a configured origin
 * happens to contain the other original origin, which is legal input: a custom
 * `WEBSITE_ORIGIN` may equal or contain the original documentation origin.
 */
export function applyOrigins(text: string, origins: Origins): string {
  const pattern = new RegExp(
    `${escapeForRegExp(DEFAULT_WEBSITE_ORIGIN)}|${escapeForRegExp(DEFAULT_DOCS_ORIGIN)}`,
    "g",
  );
  return text.replace(pattern, (match) =>
    match === DEFAULT_WEBSITE_ORIGIN ? origins.website : origins.docs,
  );
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
