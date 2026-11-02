import type { Locale } from "@syndroo/content/site-data";
import { htmlLangByLocale, ui } from "@syndroo/content/site-data";
import { ThemeCookieScript, ThemeProvider } from "@syndroo/theme";
import { SiteBehaviors } from "./site-behaviors";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteLayout({
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
          <a className="skip-link" href="#main">
            {ui[locale].website.skipToContent}
          </a>
          <SiteHeader locale={locale} languageHref={languageHref} />
          <main id="main">{children}</main>
          <SiteFooter locale={locale} />
          <SiteBehaviors locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
