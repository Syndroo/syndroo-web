import type { Metadata } from "next";
import "../globals.css";
import { DocsLayout } from "../../components/docs-layout";
import { docsOrigin } from "../../lib/origins";

export const metadata: Metadata = {
  metadataBase: new URL(docsOrigin()),
  title: "Syndroo documentation",
  icons: { icon: [{ url: "/assets/favicon.svg", type: "image/svg+xml" }] },
  description:
    "Usage documentation for the Syndroo CLI: publish plain text to Bluesky, Threads, LinkedIn, and Mastodon, and articles to DEV.to, from your machine.",
};

export default function EnglishDocsLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <DocsLayout locale="en">{children}</DocsLayout>;
}
