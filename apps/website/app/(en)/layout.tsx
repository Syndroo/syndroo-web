import type { Metadata } from "next";
import "../globals.css";
import { SiteLayout } from "../../components/site-layout";
import { websiteOrigin } from "../../lib/origins";

export const metadata: Metadata = {
  metadataBase: new URL(websiteOrigin()),
  title: "Syndroo",
  icons: { icon: [{ url: "/assets/favicon.svg", type: "image/svg+xml" }] },
  description:
    "Publish plain text to Bluesky, Threads, LinkedIn, and Mastodon, and articles to DEV.to, from your own machine.",
};

export default function EnglishLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <SiteLayout locale="en">{children}</SiteLayout>;
}
