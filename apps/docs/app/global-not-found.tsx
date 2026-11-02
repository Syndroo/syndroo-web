import "./globals.css";
import { DocsLayout } from "../components/docs-layout";

export default function GlobalNotFound(): React.JSX.Element {
  return (
    <DocsLayout
      locale="en"
      title="Page not found - Syndroo documentation"
      languageHref="/zh/"
    >
      <main className="content" id="main">
        <article>
          <p className="eyebrow">Syndroo docs</p>
          <h1 id="not-found">That page does not exist.</h1>
          <p className="lede">
            That page is not part of these docs. Choose a current section to continue.
          </p>
          <div className="tile-grid">
            <a className="tile" href="/">
              <span className="tile-title">Getting Started</span>
              <span className="tile-text">The local CLI, optional server and agent workflow.</span>
            </a>
            <a className="tile" href="/platforms/">
              <span className="tile-title">Platforms</span>
              <span className="tile-text">One guide per official provider.</span>
            </a>
            <a className="tile" href="/reference/cli/">
              <span className="tile-title">Reference</span>
              <span className="tile-text">Commands, configuration, credentials and requests.</span>
            </a>
            <a className="tile" href="/zh/">
              <span className="tile-title">简体中文</span>
              <span className="tile-text">打开中文文档概览。</span>
            </a>
          </div>
        </article>
      </main>
    </DocsLayout>
  );
}
