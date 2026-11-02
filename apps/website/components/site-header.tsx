import { PRODUCT_REPOSITORY, primaryNavByLocale, ui } from "@syndroo/content/site-data";
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
  const languageLabel = locale === "en" ? "中文" : "English";
  const languageAria = locale === "en" ? messages.website.viewChinese : messages.website.viewEnglish;

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
            label={languageLabel}
            ariaLabel={languageAria}
            className="language-switch language-switch--topbar"
            explicitHref={languageHref}
          />
          <ThemeToggle labels={messages.theme} />
          <a className="button button--primary site-header__cta" href={PRODUCT_REPOSITORY}>
            <span className="site-header__cta-full">{messages.website.buildFromSource}</span>
            <span className="site-header__cta-short">{messages.website.build}</span>
          </a>
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
      <nav className="site-menu" id="site-menu" aria-label={messages.website.menu} hidden>
        {navItems.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
        <LanguageSwitch
          locale={locale}
          label={languageLabel}
          ariaLabel={languageAria}
          className="language-switch language-switch--menu"
          explicitHref={languageHref}
        />
        <a href={`${PRODUCT_REPOSITORY}#readme`}>{messages.website.buildFromSource}</a>
      </nav>
    </header>
  );
}
