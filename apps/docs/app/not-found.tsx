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
          That page is not part of these docs. The links below cover the local publishing path.
        </p>
        <div className="tile-grid">
          <a className="tile" href="/">
            <span className="tile-title">Quick start</span>
            <span className="tile-text">Install the CLI, bind one account, publish once, and read the result.</span>
          </a>
          <a className="tile" href="/commands/">
            <span className="tile-title">Command reference</span>
            <span className="tile-text">Every local command, its flags and its exit codes.</span>
          </a>
          <a className="tile" href="/faq/">
            <span className="tile-title">FAQ</span>
            <span className="tile-text">Config failures, expired plans, unknown results and state recovery.</span>
          </a>
        </div>
      </article>
    </main>
  );
}
