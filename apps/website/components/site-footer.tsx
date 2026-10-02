// The shared marketing footer, including the cross-site documentation links.
import { footerGroups, PRODUCT_REPOSITORY } from "@syndroo/content/site-data";

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
            <li>
              <a className="icon-link" href="https://bsky.app" aria-label="Bluesky">
                <span className="mark mark--bluesky" aria-hidden="true"></span>
              </a>
            </li>
            <li>
              <a className="icon-link" href="https://www.threads.net" aria-label="Threads">
                <span className="mark mark--threads" aria-hidden="true"></span>
              </a>
            </li>
            <li>
              <a className="icon-link" href="https://www.linkedin.com" aria-label="LinkedIn">
                <span className="mark mark--linkedin" aria-hidden="true"></span>
              </a>
            </li>
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
