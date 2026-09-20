// Single maintained metadata source for both sites.
//
// This module is plain data so the Node 24 build can import it directly and
// compile the same file into either site's browser bundle. Keep it free of
// imports and of TypeScript-only runtime syntax: Node's type stripping rewrites
// it verbatim into generated browser JavaScript.
//
// What lives here: the product and design versions, the capability record for
// each platform, the agent access methods, the shared navigation, and the page
// registries used for sitemaps, expected build output and the docs search index.
// What does not live here: anything that would turn mock-tested adapters into
// validated ones. A status changes only with real acceptance evidence.

/**
 * Where the capability record was read from, so a reviewer can check it.
 * `coreCommit` is the product-repository revision the facts were taken from.
 */
export type FactsSource = {
  coreRepository: string;
  coreCommit: string;
  /** Date the platform and client facts were last reviewed against that revision. */
  reviewed: string;
};

export const factsSource: FactsSource = {
  coreRepository: "https://github.com/Syndroo/syndroo",
  coreCommit: "87ba42b",
  reviewed: "2026-09-18",
};

/**
 * Origins written into authored sources. Both builds rewrite these to the
 * configured origin pair; a fixture test keeps them equal to the defaults in
 * `scripts/lib/origins.ts`.
 */
export type OriginPlaceholders = {
  website: string;
  docs: string;
};

export const ORIGIN_PLACEHOLDERS: OriginPlaceholders = {
  website: "http://localhost:4173",
  docs: "http://localhost:4174",
};

/**
 * Four distinct version facts. The design iteration version is not the product
 * version and must never be substituted for it.
 */
export type Versions = {
  /** Product candidate version reported by the Worker and the docs. */
  product: string;
  /** Publication state of the product candidate. */
  releaseStage: string;
  /** Website design iteration described by this repository. */
  design: string;
  /** Version the documentation describes. */
  docs: string;
};

export const versions: Versions = {
  product: "0.2.0-rc.1",
  releaseStage: "unpublished release candidate",
  design: "0.4.0",
  docs: "0.2.0-rc.1",
};

/**
 * Public capability status. No live-account acceptance record exists for this
 * candidate, so no platform is described as validated.
 */
export type PlatformStatus = "mock-tested" | "experimental";

export type Platform = {
  /** Platform key used by the publishing API. */
  id: string;
  name: string;
  /** CSS modifier for the local platform mark, `platform-icon--<icon>`. */
  icon: string;
  /** Provider identifier returned in a publication entry. */
  provider: string;
  status: PlatformStatus;
  statusLabel: string;
  /** Text limits enforced by the adapter before network access. */
  limit: string;
  /** Worker secret names this platform needs. */
  credentials: string;
  /** Documentation guide path on the docs origin. */
  guide: string;
  /** Source package in the product repository. */
  source: string;
  /** Official provider documentation, as recorded for this candidate. */
  references: { label: string; href: string }[];
  /** One-sentence honest summary of what is and is not verified. */
  summary: string;
  /** The evidence behind `status`, stated without claiming more than that. */
  evidence: string;
};

export const platforms: Platform[] = [
  {
    id: "bluesky",
    name: "Bluesky",
    icon: "bluesky",
    provider: "bluesky-native",
    status: "mock-tested",
    statusLabel: "Mock-tested",
    limit: "300 Unicode code points and 3,000 UTF-8 bytes (enforced by the candidate)",
    credentials: "BLUESKY_IDENTIFIER, BLUESKY_PASSWORD (app password), optional BLUESKY_HOST",
    guide: "/platforms/bluesky/",
    source: "https://github.com/Syndroo/syndroo/tree/main/packages/bluesky",
    references: [
      { label: "Bluesky API documentation", href: "https://docs.bsky.app/" },
      {
        label: "Official @atproto/api SDK",
        href: "https://github.com/bluesky-social/atproto/tree/main/packages/api",
      },
    ],
    summary:
      "Uses the official @atproto/api SDK. Exercised locally by the Mock SNS end-to-end gate; no live-account acceptance record exists yet.",
    evidence:
      "Unit tests plus the local Mock SNS end-to-end gate in the core repository. Recorded as mock-tested in the 0.2.0-rc.1 README; live-account acceptance is an open release gate.",
  },
  {
    id: "threads",
    name: "Threads",
    icon: "threads",
    provider: "threads-native",
    status: "mock-tested",
    statusLabel: "Mock-tested",
    limit: "500 characters",
    credentials:
      "THREADS_ACCESS_TOKEN (long-lived user token with threads_basic and threads_content_publish)",
    guide: "/platforms/threads/",
    source: "https://github.com/Syndroo/syndroo/tree/main/packages/threads",
    references: [
      { label: "Threads API documentation", href: "https://developers.facebook.com/docs/threads" },
      { label: "Meta Threads API collection", href: "https://www.postman.com/meta/threads/overview" },
    ],
    summary:
      "Native HTTP adapter. Exercised locally by the Mock SNS end-to-end gate; no live-account acceptance record exists yet, and long-lived tokens are refreshed by you, not by Syndroo.",
    evidence:
      "Unit tests plus the local Mock SNS end-to-end gate in the core repository. Recorded as mock-tested in the 0.2.0-rc.1 README; live-account acceptance is an open release gate.",
  },
  {
    id: "x",
    name: "X",
    icon: "x",
    provider: "x-sdk",
    status: "experimental",
    statusLabel: "Experimental",
    limit: "280 weighted characters",
    credentials: "X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET",
    guide: "/platforms/x/",
    source: "https://github.com/Syndroo/syndroo/tree/main/packages/x",
    references: [
      { label: "TypeScript XDK", href: "https://docs.x.com/tools/typescript-xdk" },
      { label: "Counting characters", href: "https://docs.x.com/fundamentals/counting-characters" },
      { label: "Create a post", href: "https://docs.x.com/x-api/posts/create-post" },
    ],
    summary:
      "Uses the official @xdevplatform/xdk SDK with OAuth 1.0a user authentication. Implemented and unit-tested; no live-account acceptance record exists.",
    evidence:
      "Unit tests in the core repository, including workerd coverage. Recorded as experimental in the 0.2.0-rc.1 README.",
  },
  {
    id: "tumblr",
    name: "Tumblr",
    icon: "tumblr",
    provider: "tumblr-native",
    status: "experimental",
    statusLabel: "Experimental",
    limit: "4,096 Unicode code points",
    credentials:
      "TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET, TUMBLR_TOKEN, TUMBLR_TOKEN_SECRET, TUMBLR_BLOG",
    guide: "/platforms/tumblr/",
    source: "https://github.com/Syndroo/syndroo/tree/main/packages/tumblr",
    references: [
      { label: "Tumblr OAuth applications", href: "https://www.tumblr.com/oauth/apps" },
      { label: "NPF publishing API", href: "https://github.com/tumblr/docs/blob/master/api.md" },
    ],
    summary:
      "Native HTTP adapter with OAuth 1.0a signing. Implemented and unit-tested; no live-account acceptance record exists, and it publishes one NPF text block only.",
    evidence:
      "Unit tests and the approved native-HTTP spike recorded in the core repository. Recorded as experimental in the 0.2.0-rc.1 README.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    provider: "linkedin-native",
    status: "experimental",
    statusLabel: "Experimental",
    limit: "3,000 UTF-16 units after escaping",
    credentials: "LINKEDIN_ACCESS_TOKEN, LINKEDIN_AUTHOR, LINKEDIN_API_VERSION",
    guide: "/platforms/linkedin/",
    source: "https://github.com/Syndroo/syndroo/tree/main/packages/linkedin",
    references: [
      {
        label: "Posts API and permissions",
        href: "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api",
      },
      {
        label: "API versioning",
        href: "https://learn.microsoft.com/en-us/linkedin/marketing/versioning",
      },
    ],
    summary:
      "Independently written native HTTP adapter for POST /rest/posts. Implemented and unit-tested; no live-account acceptance record exists.",
    evidence:
      "Unit tests in the core repository, including workerd coverage. Recorded as experimental in the 0.2.0-rc.1 README.",
  },
];

/**
 * Agent access methods. Nothing here is shipped or verified: the HTTP workflow
 * is the only path that exists today, and no Syndroo-owned skill, plugin or
 * client integration has been built or tested.
 */
export type AgentClient = {
  id: string;
  name: string;
  method: string;
  status: "documented" | "not-verified";
  statusLabel: string;
  note: string;
};

export const agentClients: AgentClient[] = [
  {
    id: "http-workflow",
    name: "Client-managed HTTP workflow",
    method: "Manual HTTP workflow",
    status: "documented",
    statusLabel: "Documented, not verified end to end",
    note:
      "The agent sends the same authenticated request shown in the API reference, and a person confirms the text before it goes out.",
  },
  {
    id: "syndroo-skill",
    name: "Syndroo skill or plugin",
    method: "Packaged skill",
    status: "not-verified",
    statusLabel: "Not built",
    note:
      "No Syndroo-authored skill, plugin or tool package exists for this candidate, so there is nothing to install.",
  },
  {
    id: "mcp-server",
    name: "MCP server",
    method: "Model Context Protocol",
    status: "not-verified",
    statusLabel: "Out of scope",
    note: "No MCP server ships with this candidate, and building one is outside the current roadmap.",
  },
];

export type NavItem = {
  label: string;
  href: string;
};

/** Marketing navigation. Cross-site links carry the docs placeholder origin. */
export const primaryNav: NavItem[] = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Agent setup", href: `${ORIGIN_PLACEHOLDERS.docs}/agent-setup/` },
  { label: "Platforms", href: "/#platforms" },
  { label: "Docs", href: `${ORIGIN_PLACEHOLDERS.docs}/` },
  { label: "GitHub", href: "https://github.com/Syndroo/syndroo" },
];

export type FooterColumn = {
  title: string;
  items: NavItem[];
};

export const footerNav: FooterColumn[] = [
  {
    title: "Product",
    items: [
      { label: "Documentation", href: `${ORIGIN_PLACEHOLDERS.docs}/` },
      { label: "Agent setup", href: `${ORIGIN_PLACEHOLDERS.docs}/agent-setup/` },
      { label: "Quickstart", href: `${ORIGIN_PLACEHOLDERS.docs}/quickstart/` },
      { label: "API reference", href: `${ORIGIN_PLACEHOLDERS.docs}/api/` },
      { label: "Changelog", href: "/changelog/" },
    ],
  },
  {
    title: "Project",
    items: [
      { label: "About", href: "/about/" },
      { label: "Blog", href: "/blog/" },
      { label: "Contact: GitHub Issues", href: "https://github.com/Syndroo/syndroo/issues" },
      { label: "GitHub", href: "https://github.com/Syndroo/syndroo" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", href: "/privacy/" },
      { label: "Terms", href: "/terms/" },
      { label: "License (Apache-2.0)", href: "https://github.com/Syndroo/syndroo/blob/main/LICENSE" },
    ],
  },
];

export type DocsNavItem = {
  label: string;
  href: string;
  /** Rendered one step in from the group's main entry. */
  sub?: boolean;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavItem[];
};

/**
 * Documentation navigation. The docs build injects this into every page, so a
 * new page becomes reachable everywhere by adding one entry here and one page.
 */
export const docsNav: DocsNavGroup[] = [
  {
    title: "Start here",
    items: [
      { label: "Overview", href: "/" },
      { label: "Choose your path", href: "/#choose-a-path" },
      { label: "First Bluesky post", href: "/quickstart/" },
      { label: "Agent setup", href: "/agent-setup/" },
    ],
  },
  {
    title: "Platform setup",
    items: [
      { label: "Bluesky", href: "/platforms/bluesky/" },
      { label: "Threads", href: "/platforms/threads/" },
      { label: "X", href: "/platforms/x/" },
      { label: "Tumblr", href: "/platforms/tumblr/" },
      { label: "LinkedIn", href: "/platforms/linkedin/" },
    ],
  },
  {
    title: "Recipes",
    items: [
      { label: "Product update", href: "/recipes/product-update/" },
      { label: "Blog summary", href: "/recipes/blog-distribution/" },
      { label: "CI and script calls", href: "/recipes/api-automation/" },
    ],
  },
  {
    title: "API reference",
    items: [
      { label: "HTTP API", href: "/api/" },
      { label: "Create a post", href: "/api/#create-a-post", sub: true },
      { label: "Check a post", href: "/api/#get-a-post", sub: true },
      { label: "Errors", href: "/api/#errors", sub: true },
      { label: "Limits", href: "/api/#limits", sub: true },
    ],
  },
  {
    title: "Concepts",
    items: [
      { label: "Delivery and guarantees", href: "/concepts/" },
      { label: "Idempotency", href: "/concepts/#idempotency", sub: true },
      { label: "Ambiguous outcomes", href: "/concepts/#ambiguous-outcomes", sub: true },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Cloudflare deployment", href: "/operations/cloudflare/" },
      { label: "Local development", href: "/operations/local/" },
    ],
  },
];

/**
 * One authored page. `file` is the built path relative to the app's output
 * directory; `path` is the public URL path used by sitemaps and canonical links.
 */
export type PageEntry = {
  file: string;
  path: string;
  label: string;
};

export const websitePages: PageEntry[] = [
  { file: "index.html", path: "/", label: "Home" },
  { file: "about/index.html", path: "/about/", label: "About" },
  { file: "blog/index.html", path: "/blog/", label: "Blog" },
  {
    file: "blog/safe-cross-posting-with-idempotency/index.html",
    path: "/blog/safe-cross-posting-with-idempotency/",
    label: "Tutorial: safe text cross-posting",
  },
  { file: "changelog/index.html", path: "/changelog/", label: "Changelog" },
  { file: "privacy/index.html", path: "/privacy/", label: "Privacy" },
  { file: "terms/index.html", path: "/terms/", label: "Terms" },
];

export const docsPages: PageEntry[] = [
  { file: "index.html", path: "/", label: "Overview" },
  { file: "quickstart/index.html", path: "/quickstart/", label: "First Bluesky post" },
  { file: "agent-setup/index.html", path: "/agent-setup/", label: "Agent setup" },
  {
    file: "platforms/bluesky/index.html",
    path: "/platforms/bluesky/",
    label: "Platform setup: Bluesky",
  },
  {
    file: "platforms/threads/index.html",
    path: "/platforms/threads/",
    label: "Platform setup: Threads",
  },
  { file: "platforms/x/index.html", path: "/platforms/x/", label: "Platform setup: X" },
  { file: "platforms/tumblr/index.html", path: "/platforms/tumblr/", label: "Platform setup: Tumblr" },
  {
    file: "platforms/linkedin/index.html",
    path: "/platforms/linkedin/",
    label: "Platform setup: LinkedIn",
  },
  {
    file: "recipes/product-update/index.html",
    path: "/recipes/product-update/",
    label: "Recipe: product update",
  },
  {
    file: "recipes/blog-distribution/index.html",
    path: "/recipes/blog-distribution/",
    label: "Recipe: blog summary",
  },
  {
    file: "recipes/api-automation/index.html",
    path: "/recipes/api-automation/",
    label: "Recipe: CI and script calls",
  },
  { file: "api/index.html", path: "/api/", label: "HTTP API" },
  { file: "concepts/index.html", path: "/concepts/", label: "Delivery and guarantees" },
  {
    file: "operations/cloudflare/index.html",
    path: "/operations/cloudflare/",
    label: "Cloudflare deployment",
  },
  { file: "operations/local/index.html", path: "/operations/local/", label: "Local development" },
];
