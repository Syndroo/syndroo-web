import type { Metadata } from "next";

// The docs layout supplies the topbar, sidebar and footer; every page supplies
// its own <main id="main">, so the not-found page must supply one too. Without
// it the layout's skip link would point at a missing target.
export const metadata: Metadata = {
  title: "Page not found - Syndroo documentation",
  robots: { index: false, follow: false },
};

export default function NotFound(): React.JSX.Element {
  return (
    <main className="content" id="main">
      <article>
        <p className="eyebrow">Syndroo docs</p>
        <h1 id="not-found">That page does not exist.</h1>
        <p className="lede">
          That page is not part of these docs. The documentation was reorganised into Getting
          Started, Platforms, Build and Reference, and an older link will not redirect: pick a
          section below.
        </p>
        <div className="tile-grid">
          <a className="tile" href="/">
            <span className="tile-title">Getting Started</span>
            <span className="tile-text">
              Install the CLI, connect one account, prepare and execute a publication, and read the
              result.
            </span>
          </a>
          <a className="tile" href="/platforms/">
            <span className="tile-title">Platforms</span>
            <span className="tile-text">
              One guide per official provider, with credential fields, egress origins and what is
              still unverified.
            </span>
          </a>
          <a className="tile" href="/reference/cli/">
            <span className="tile-title">Reference</span>
            <span className="tile-text">
              The three commands with every flag, the configuration file, credentials and the
              request shapes.
            </span>
          </a>
        </div>
      </article>
    </main>
  );
}
