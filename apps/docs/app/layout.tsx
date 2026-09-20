import type { Metadata } from "next";
import "./globals.css";
import { ThemeCookieScript, ThemeProvider } from "@syndroo/theme";
import { DocsBehaviors } from "../components/docs-behaviors";
import { DocsFooter, DocsSearchDialog, DocsTopbar } from "../components/docs-chrome";
import { DocsSidebarClient } from "../components/docs-sidebar-client";
import { docsOrigin } from "../lib/origins";

export const metadata: Metadata = {
  metadataBase: new URL(docsOrigin()),
  title: "Syndroo documentation",
  description: "Documentation for the Syndroo self-hosted publishing API.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Runs before next-themes' own pre-paint script, so the shared cookie wins. */}
        <ThemeCookieScript />
        <ThemeProvider>
          <DocsTopbar />
          <div className="layout">
            <DocsSidebarClient />
            <div className="sidebar-scrim" id="sidebar-scrim" hidden></div>
            {children}
          </div>
          <DocsFooter />
          <DocsSearchDialog />
          <DocsBehaviors />
        </ThemeProvider>
      </body>
    </html>
  );
}
