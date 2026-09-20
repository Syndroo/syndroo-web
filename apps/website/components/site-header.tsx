// The shared marketing header. Navigation comes from packages/content so a new
// page cannot drift away from the registry; the mobile menu is the same
// keyboard-operable control the authored pages had, driven by
// components/site-behaviors.tsx.
import { primaryNav } from "@syndroo/content/site-data";
import { ThemeToggle } from "@syndroo/theme";

export function SiteHeader(): React.JSX.Element {
  return (
    <header className="site-header" data-menu-open="false">
      <div className="wrap site-header__inner">
        <a className="brand" href="/">
          <img src="/assets/logo.svg" alt="" width="30" height="30" />
          Syndroo
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
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
