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
export const PUBLIC_NODE_RUNTIME = "Node.js 22 or newer";

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
      { label: "Command reference", href: `${ORIGIN_PLACEHOLDERS.docs}/commands/` },
      { label: "Accounts", href: `${ORIGIN_PLACEHOLDERS.docs}/accounts/` },
      { label: "Publishing", href: `${ORIGIN_PLACEHOLDERS.docs}/publishing/` },
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
 */
export const docsNav: DocsNavGroup[] = [
  {
    title: "Start",
    items: [{ label: "Quickstart", href: "/" }],
  },
  {
    title: "Guides",
    items: [
      { label: "Accounts", href: "/accounts/" },
      { label: "Publishing and retries", href: "/publishing/" },
      { label: "Agent usage", href: "/agent-setup/" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Commands", href: "/commands/" },
      { label: "FAQ", href: "/faq/" },
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
  { file: "index.html", path: "/", label: "Quickstart" },
  { file: "accounts/index.html", path: "/accounts/", label: "Accounts" },
  { file: "publishing/index.html", path: "/publishing/", label: "Publishing and retries" },
  { file: "agent-setup/index.html", path: "/agent-setup/", label: "Agent usage" },
  { file: "commands/index.html", path: "/commands/", label: "Commands" },
  { file: "faq/index.html", path: "/faq/", label: "FAQ" },
];
