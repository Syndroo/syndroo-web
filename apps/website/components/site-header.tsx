// The shared marketing header and its keyboard-operable mobile menu.
import { PRODUCT_REPOSITORY, primaryNav } from "@syndroo/content/site-data";
import { ThemeToggle } from "@syndroo/theme";

export function SiteHeader(): React.JSX.Element {
  return (
    <header className="site-header" data-menu-open="false">
      <div className="shell site-header__inner">
        <a className="brand" href="/">
          <img src="/assets/logo.svg" alt="" width="34" height="32" />
          <span className="brand-name">Syndroo</span>
        </a>
        <nav className="site-nav" id="site-nav" aria-label="Main">
          {primaryNav.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="site-header__actions">
          <ThemeToggle />
          <a className="button button--primary site-header__cta" href={PRODUCT_REPOSITORY}>
            <span className="site-header__cta-full">Build from source</span>
            <span className="site-header__cta-short">Build</span>
          </a>
          <button className="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu">
            <span className="nav-toggle__bars" aria-hidden="true" />
            <span className="nav-toggle__label">Menu</span>
          </button>
        </div>
      </div>
      <nav className="site-menu" id="site-menu" aria-label="Menu" hidden>
        {primaryNav.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
        <a href={`${PRODUCT_REPOSITORY}#readme`}>Build from source</a>
      </nav>
    </header>
  );
}
