// The shared marketing header. Navigation comes from packages/content so a new
// page cannot drift away from the registry; the mobile menu is the same
// keyboard-operable control the authored pages had, driven by
// components/site-behaviors.tsx.
import { ORIGIN_PLACEHOLDERS, primaryNav } from "@syndroo/content/site-data";
import { ThemeToggle } from "@syndroo/theme";

export function SiteHeader(): React.JSX.Element {
  return (
    <header className="site-header" data-menu-open="false">
      <div className="shell site-header__inner">
        <a className="brand" href="/">
          <img src="/assets/logo.svg" alt="" width="26" height="26" />
          <span className="brand-name">Syndroo</span>
        </a>
        <button className="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          <span className="nav-toggle__bars" aria-hidden="true" />
          <span className="nav-toggle__label">Menu</span>
        </button>
        <nav className="site-nav" id="site-nav" aria-label="Main">
          {primaryNav.map((item) => (
            <a key={item.label} href={item.href} rel={item.href.startsWith("http") ? "noreferrer" : undefined}>
              {item.label}
            </a>
          ))}
          <a className="site-header__cta" href={`${ORIGIN_PLACEHOLDERS.docs}/`}>
            Quick start
          </a>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
