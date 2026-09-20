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
          The documentation page you asked for is not part of this version. The links below cover the whole surface that
          exists today.
        </p>
        <div className="tile-grid">
          <a className="tile" href="/quickstart/">
            <span className="tile-title">First Bluesky post</span>
            <span className="tile-text">One platform, one credential set, one request, and the result read back.</span>
          </a>
          <a className="tile" href="/agent-setup/">
            <span className="tile-title">Agent setup</span>
            <span className="tile-text">The documented HTTP workflow and its guardrails.</span>
          </a>
          <a className="tile" href="/api/">
            <span className="tile-title">HTTP API reference</span>
            <span className="tile-text">Every field, status and error code in the current contract.</span>
          </a>
        </div>
      </article>
    </main>
  );
}
