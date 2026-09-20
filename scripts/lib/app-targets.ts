// One place that knows where each Next.js app lives and how it is built.
//
// The two sites stay independent: separate app directories, separate `out/`
// exports, separate origins. Only the tooling is shared.
import { join } from "node:path";
import { repoRoot } from "./paths.ts";
import { DEFAULT_DOCS_PORT, DEFAULT_WEBSITE_PORT, type Origins } from "./origins.ts";
import { docsPages, websitePages } from "../../packages/content/site-data.ts";

export type SiteTarget = {
  /** Workspace name, used in logs. */
  name: string;
  appRoot: string;
  outRoot: string;
  /** The configured origin this site is built for. */
  origin: (origins: Origins) => string;
  /** Loopback port the preview server uses. */
  port: number;
  /** Built page paths relative to `out/`, used by the check and the audit. */
  expectedPages: ReadonlyArray<string>;
};

export const SITE_TARGETS: ReadonlyArray<SiteTarget> = [
  {
    name: "@syndroo/website",
    appRoot: join(repoRoot, "apps/website"),
    outRoot: join(repoRoot, "apps/website/out"),
    origin: (origins) => origins.website,
    port: DEFAULT_WEBSITE_PORT,
    expectedPages: websitePages.map((page) => page.file),
  },
  {
    name: "@syndroo/docs",
    appRoot: join(repoRoot, "apps/docs"),
    outRoot: join(repoRoot, "apps/docs/out"),
    origin: (origins) => origins.docs,
    port: DEFAULT_DOCS_PORT,
    expectedPages: docsPages.map((page) => page.file),
  },
];
