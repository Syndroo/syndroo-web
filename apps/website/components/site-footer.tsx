// The shared marketing footer, including the cross-site documentation links.
import { footerGroups, platforms, PRODUCT_REPOSITORY } from "@syndroo/content/site-data";

// Only platforms with a local mark asset get an icon button; the rest are
// named with their real destination in the footer's platform column.
const MARKED_PLATFORMS = platforms.filter((platform) => platform.label === undefined);

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div className="site-footer__brand">
          <a className="site-footer__logo" href="/">
            <img src="/assets/logo.svg" alt="" width="46" height="44" />
            <span>Syndroo</span>
          </a>
          <ul className="site-footer__icons">
            <li>
              <a
                className="icon-link"
                href={PRODUCT_REPOSITORY}
                aria-label="Syndroo source repository"
              >
                <img src="/assets/logo.svg" alt="" width="16" height="16" />
              </a>
            </li>
            {MARKED_PLATFORMS.map((platform) => (
              <li key={platform.id}>
                <a className="icon-link" href={platform.url} aria-label={platform.name}>
                  <span className={`mark mark--${platform.icon}`} aria-hidden="true"></span>
                </a>
              </li>
            ))}
          </ul>
          <p className="site-footer__bottom">
            <span>&copy; 2026 Syndroo</span>
          </p>
        </div>
        <div className="site-footer__cols">
          {footerGroups.map((group) => (
            <div className="site-footer__col" key={group.title}>
              <h3 className="col-title">{group.title}</h3>
              <ul>
                {group.items.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
