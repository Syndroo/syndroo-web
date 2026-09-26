import type { Metadata } from "next";
import "./globals.css";
import { SiteBehaviors } from "../components/site-behaviors";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { ThemeCookieScript, ThemeProvider } from "@syndroo/theme";
import { websiteOrigin } from "../lib/origins";

// metadataBase makes the per-page `alternates.canonical` a configured origin
// instead of a hard-coded host.
export const metadata: Metadata = {
  metadataBase: new URL(websiteOrigin()),
  title: "Syndroo",
  icons: { icon: [{ url: "/assets/favicon.svg", type: "image/svg+xml" }] },
  description: "Publish text to Bluesky and Threads from your own machine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Runs before next-themes' own pre-paint script, so the shared cookie wins. */}
        <ThemeCookieScript />
        <ThemeProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <SiteBehaviors />
        </ThemeProvider>
      </body>
    </html>
  );
}
