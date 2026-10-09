// Single maintained metadata source for both sites.
//
// This module is plain data so the Node 24 build can import it directly and
// compile the same file into either site's browser bundle. Keep it free of
// imports and of TypeScript-only runtime syntax: Node's type stripping rewrites
// it verbatim into generated browser JavaScript.
//
// What lives here: the candidate versions, the five supported platforms, the
// shared navigation and the page registries used for sitemaps, expected build
// output and the docs search index.

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

export const PRODUCT_REPOSITORY = "https://github.com/Syndroo/syndroo";
export const PRODUCT_LICENSE_URL = `${PRODUCT_REPOSITORY}/blob/main/LICENSE`;

/**
 * Version facts. The CLI is the documented product surface, and the docs site
 * describes the same candidate. No candidate is published to a registry.
 */
export type Versions = {
  /** Candidate version of `@syndroo/cli`, whose local path needs no server. */
  cli: string;
  /** Version the documentation describes; the same CLI candidate. */
  docs: string;
  /** Publication state shared by the candidate. */
  releaseStage: string;
};

export const versions: Versions = {
  cli: "0.7.0-rc.1",
  docs: "0.7.0-rc.1",
  releaseStage: "unpublished release candidate",
};

/** Minimum runtime the packaged CLI declares in its `engines` field. */
export const PUBLIC_NODE_RUNTIME = "Node.js 24.19 or newer";

/**
 * The accepted CLI surface the documentation is allowed to print.
 *
 * Mirrors the accepted decision Q13 and section 12.1 of
 * `docs/superpowers/specs/architecture-v1/01-architecture-design.md` in the
 * product repository: exactly three first-level commands (`connect`, `publish`,
 * `status`) plus the global flags `--config`, `--json`, `--verbose`,
 * `--no-color`, `--help` and `--version`. `--help` and `--version` are the
 * documented help/version surface, so there is no fourth command to print.
 *
 * The per-command flag lists are the CLI's own `--help` output. The build
 * checker runs the real CLI and fails when this list and the shipped flags
 * drift apart, so this is a mirror to audit against, not a second source of
 * truth.
 */
export type CliCommandSurface = {
  name: string;
  flags: string[];
};

export const cliSurface = {
  spec: "architecture-v1 section 12.1 / decision Q13",
  globalFlags: ["--config", "--json", "--verbose", "--no-color", "--help", "--version"],
  commands: [
    {
      name: "connect",
      flags: [
        "--label",
        "--connection",
        "--from-env",
        "--credential-file",
        "--update",
        "--disconnect",
        "--input",
        "--redirect-uri",
        "--callback-url",
        "--default",
        "--no-default",
      ],
    },
    {
      name: "publish",
      flags: ["--input", "--data", "--retry", "--to", "--request-id", "--dry-run"],
    },
    {
      name: "status",
      flags: ["--provider", "--connections", "--operation", "--operations", "--limit", "--cursor"],
    },
  ] satisfies CliCommandSurface[],
} as const;

/**
 * The five platforms the local CLI publishes to, their CSS marks and the public
 * destination the footer links to. The homepage names them and nothing more:
 * limits and credential groups belong to the platform's own documentation, not
 * to a marketing one-liner.
 */
export type Platform = {
  /** Platform key used by a local publish document and by the CSS modifier. */
  id: string;
  name: string;
  /** CSS modifier for the local platform card, `app-icon--<icon>`. */
  icon: string;
  /** Public destination the footer links to. */
  url: string;
  /**
   * Short typographic label for a card with no local mark asset. A platform
   * that ships a mask asset leaves this unset and renders the mark instead.
   */
  label?: string;
};

export const platforms: Platform[] = [
  { id: "bluesky", name: "Bluesky", icon: "bluesky", url: "https://bsky.app" },
  { id: "threads", name: "Threads", icon: "threads", url: "https://www.threads.net" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin", url: "https://www.linkedin.com" },
  { id: "mastodon", name: "Mastodon", icon: "mastodon", url: "https://joinmastodon.org", label: "M" },
  { id: "devto", name: "DEV.to", icon: "devto", url: "https://dev.to", label: "DEV" },
];

export type NavItem = {
  label: string;
  href: string;
};

/** Site navigation. Cross-site links carry the docs placeholder origin. */
export const primaryNav: NavItem[] = [
  { label: "Workflow", href: "/#workflow" },
  { label: "Platforms", href: "/#platforms" },
  { label: "FAQ", href: "/#faq" },
  { label: "Docs", href: `${ORIGIN_PLACEHOLDERS.docs}/` },
  { label: "GitHub", href: PRODUCT_REPOSITORY },
];

export type FooterGroup = {
  title: string;
  items: NavItem[];
};

export const footerGroups: FooterGroup[] = [
  {
    title: "Documentation",
    items: [
      { label: "Docs", href: `${ORIGIN_PLACEHOLDERS.docs}/` },
      { label: "CLI reference", href: `${ORIGIN_PLACEHOLDERS.docs}/reference/cli/` },
      { label: "Platform guides", href: `${ORIGIN_PLACEHOLDERS.docs}/platforms/` },
    ],
  },
  {
    title: "Project",
    items: [
      { label: "Source code", href: PRODUCT_REPOSITORY },
      { label: "Issues", href: `${PRODUCT_REPOSITORY}/issues` },
      { label: "License", href: PRODUCT_LICENSE_URL },
    ],
  },
  {
    title: "Platforms",
    items: platforms.map((platform) => ({ label: platform.name, href: platform.url })),
  },
  {
    title: "Product",
    items: [
      { label: "Workflow", href: "/#workflow" },
      { label: "Platforms", href: "/#platforms" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
];

export const footerNav: NavItem[] = footerGroups.flatMap((group) => group.items);

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
 *
 * The group titles are the accepted Q39 information architecture: Getting
 * Started, Platforms, Build and Reference.
 */
export const docsNav: DocsNavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { label: "Overview", href: "/" },
      { label: "Local CLI", href: "/getting-started/local-cli/", sub: true },
      { label: "Use with an Agent", href: "/getting-started/agent/", sub: true },
    ],
  },
  {
    title: "Platforms",
    items: [
      { label: "All platforms", href: "/platforms/" },
      { label: "Bluesky", href: "/platforms/bluesky/", sub: true },
      { label: "Threads", href: "/platforms/threads/", sub: true },
      { label: "LinkedIn", href: "/platforms/linkedin/", sub: true },
      { label: "Mastodon", href: "/platforms/mastodon/", sub: true },
      { label: "DEV.to", href: "/platforms/devto/", sub: true },
    ],
  },
  {
    title: "Build",
    items: [
      { label: "Provider plugins", href: "/build/provider-plugins/" },
      { label: "Trust and registry", href: "/build/trust-and-registry/", sub: true },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "CLI", href: "/reference/cli/" },
      { label: "Configuration", href: "/reference/configuration/", sub: true },
      { label: "Credentials", href: "/reference/credentials/", sub: true },
      { label: "Requests and envelopes", href: "/reference/requests/", sub: true },
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

export const websitePages: PageEntry[] = [{ file: "index.html", path: "/", label: "Home" }];

export const docsPages: PageEntry[] = [
  { file: "index.html", path: "/", label: "Overview" },
  { file: "getting-started/local-cli/index.html", path: "/getting-started/local-cli/", label: "Local CLI" },
  { file: "getting-started/agent/index.html", path: "/getting-started/agent/", label: "Use with an Agent" },
  { file: "platforms/index.html", path: "/platforms/", label: "All platforms" },
  { file: "platforms/bluesky/index.html", path: "/platforms/bluesky/", label: "Bluesky" },
  { file: "platforms/threads/index.html", path: "/platforms/threads/", label: "Threads" },
  { file: "platforms/linkedin/index.html", path: "/platforms/linkedin/", label: "LinkedIn" },
  { file: "platforms/mastodon/index.html", path: "/platforms/mastodon/", label: "Mastodon" },
  { file: "platforms/devto/index.html", path: "/platforms/devto/", label: "DEV.to" },
  { file: "build/provider-plugins/index.html", path: "/build/provider-plugins/", label: "Provider plugins" },
  { file: "build/trust-and-registry/index.html", path: "/build/trust-and-registry/", label: "Trust and registry" },
  { file: "reference/cli/index.html", path: "/reference/cli/", label: "CLI" },
  { file: "reference/configuration/index.html", path: "/reference/configuration/", label: "Configuration" },
  { file: "reference/credentials/index.html", path: "/reference/credentials/", label: "Credentials" },
  { file: "reference/requests/index.html", path: "/reference/requests/", label: "Requests and envelopes" },
];
