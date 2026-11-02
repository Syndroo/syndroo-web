import {
  PRODUCT_REPOSITORY,
  footerGroupsByLocale,
  platforms,
  ui,
} from "@syndroo/content/site-data";
import type { Locale } from "@syndroo/content/site-data";

const MARKED_PLATFORMS = platforms.filter((platform) => platform.label === undefined);

export function SiteFooter({ locale }: { locale: Locale }): React.JSX.Element {
  const groups = footerGroupsByLocale[locale];
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div className="site-footer__brand">
          <a className="site-footer__logo" href={locale === "en" ? "/" : "/zh/"}>
            <img src="/assets/logo.svg" alt="" width="46" height="44" />
            <span>Syndroo</span>
          </a>
          <ul className="site-footer__icons">
            <li>
              <a
                className="icon-link"
                href={PRODUCT_REPOSITORY}
                aria-label={ui[locale].website.sourceRepository}
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
          {groups.map((group) => (
            <div className="site-footer__col" key={group.title}>
              <h3 className="col-title">{group.title}</h3>
              <ul>
                {group.items.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>
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
