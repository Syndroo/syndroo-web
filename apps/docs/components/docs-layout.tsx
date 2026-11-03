import type { Locale } from "@syndroo/content/site-data";
import { htmlLangByLocale } from "@syndroo/content/site-data";
import { ThemeCookieScript, ThemeProvider } from "@syndroo/theme";
import { DocsBehaviors } from "./docs-behaviors";
import { DocsFooter, DocsSearchDialog, DocsTopbar } from "./docs-chrome";
import { DocsSidebarClient } from "./docs-sidebar-client";

export function DocsLayout({
  locale,
  children,
  title,
  languageHref,
}: {
  locale: Locale;
  children: React.ReactNode;
  title?: string;
  languageHref?: string;
}): React.JSX.Element {
  return (
    <html lang={htmlLangByLocale[locale]} suppressHydrationWarning>
      {title ? (
        <head>
          <title>{title}</title>
        </head>
      ) : null}
      <body>
        <ThemeCookieScript />
        <ThemeProvider>
          <DocsTopbar locale={locale} languageHref={languageHref} />
          <div className="layout">
            <DocsSidebarClient locale={locale} />
            <div className="sidebar-scrim" id="sidebar-scrim" hidden></div>
            {children}
          </div>
          <DocsFooter locale={locale} />
          <DocsSearchDialog locale={locale} />
          <DocsBehaviors locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
