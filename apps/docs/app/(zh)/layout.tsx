import type { Metadata } from "next";
import "../globals.css";
import { DocsLayout } from "../../components/docs-layout";
import { docsOrigin } from "../../lib/origins";

export const metadata: Metadata = {
  metadataBase: new URL(docsOrigin()),
  title: "Syndroo 文档",
  icons: { icon: [{ url: "/assets/favicon.svg", type: "image/svg+xml" }] },
  description:
    "Syndroo CLI 使用文档：从你的机器将纯文本发布到 Bluesky、Threads、LinkedIn、Mastodon，并将文章发布到 DEV.to。",
};

export default function ChineseDocsLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <DocsLayout locale="zh">{children}</DocsLayout>;
}
