import { primaryNavByLocale, ui } from "@syndroo/content/site-data";
import type { Locale } from "@syndroo/content/site-data";
import { LanguageSwitch, ThemeToggle } from "@syndroo/theme";

export function SiteHeader({
  locale,
  languageHref,
}: {
  locale: Locale;
  languageHref?: string;
}): React.JSX.Element {
  const messages = ui[locale];
  const navItems = primaryNavByLocale[locale];

  return (
    <header className="site-header" data-menu-open="false">
      <div className="shell site-header__inner">
        <a className="brand" href={locale === "en" ? "/" : "/zh/"}>
          <img src="/assets/logo.svg" alt="" width="34" height="32" />
          <span className="brand-name">Syndroo</span>
        </a>
        <nav className="site-nav" id="site-nav" aria-label={messages.website.mainNav}>
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="site-header__actions">
          <LanguageSwitch
            locale={locale}
            label={messages.language}
            className="language-switch language-switch--topbar"
            explicitHref={languageHref}
          />
          <ThemeToggle labels={messages.theme} />
          <button
            className="nav-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="site-menu"
            data-menu-label={messages.website.menu}
            data-close-label={messages.website.close}
          >
            <span className="nav-toggle__bars" aria-hidden="true" />
            <span className="nav-toggle__label">{messages.website.menu}</span>
          </button>
        </div>
      </div>
      <button
        className="site-menu-backdrop"
        id="site-menu-backdrop"
        type="button"
        aria-label={messages.website.close}
        hidden
      />
      <nav className="site-menu" id="site-menu" aria-label={messages.website.menu} hidden>
        <div className="site-menu__head">
          <span>{messages.website.menu}</span>
          <button className="site-menu__close" type="button" aria-label={messages.website.close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6 18 18M18 6 6 18" />
            </svg>
          </button>
        </div>
        {navItems.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
