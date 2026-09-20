// The shared marketing footer: same columns, wording and links as the authored
// pages, with the navigation taken from the shared content registry.
import { footerNav, versions } from "@syndroo/content/site-data";

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <a className="brand" href="/" style={{ marginBottom: "12px" }}>
              <img src="/assets/logo.svg" alt="" width="26" height="26" />
              Syndroo
            </a>
            <p>Open-source publishing infrastructure for the social web, under the Apache License 2.0.</p>
          </div>
          {footerNav.map((column) => (
            <div key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} rel={item.href.startsWith("http") ? "noreferrer" : undefined}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="site-footer__bottom">
          <span>Prototype content for review. Release candidate {versions.product} is unpublished.</span>
          <span>&copy; 2026 Syndroo</span>
        </div>
      </div>
    </footer>
  );
}
