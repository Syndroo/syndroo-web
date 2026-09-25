// The shared marketing footer: a one-line description and the three links the
// site keeps (documentation, source, licence), taken from the shared registry.
import { footerNav } from "@syndroo/content/site-data";

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
            <p>Publish text to Bluesky and Threads from your own machine.</p>
          </div>
          <nav className="site-footer__links" aria-label="Footer">
            <ul>
              {footerNav.map((item) => (
                <li key={item.label}>
                  <a href={item.href} rel={item.href.startsWith("http") ? "noreferrer" : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="site-footer__bottom">
          <span>&copy; 2026 Syndroo</span>
        </div>
      </div>
    </footer>
  );
}
