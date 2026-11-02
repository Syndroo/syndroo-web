import type { Metadata } from "next";
import "../globals.css";
import { SiteLayout } from "../../components/site-layout";
import { websiteOrigin } from "../../lib/origins";

export const metadata: Metadata = {
  metadataBase: new URL(websiteOrigin()),
  title: "Syndroo",
  icons: { icon: [{ url: "/assets/favicon.svg", type: "image/svg+xml" }] },
  description:
    "从你自己的机器将纯文本发布到 Bluesky、Threads、LinkedIn、Mastodon，并将文章发布到 DEV.to。",
};

export default function ChineseLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <SiteLayout locale="zh">{children}</SiteLayout>;
}
