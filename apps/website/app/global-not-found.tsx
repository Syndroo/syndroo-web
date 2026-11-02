import "./globals.css";
import { SiteLayout } from "../components/site-layout";

export default function GlobalNotFound(): React.JSX.Element {
  return (
    <SiteLayout locale="en" title="Page not found - Syndroo" languageHref="/zh/">
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">Syndroo</p>
          <h1 className="hero__title" id="hero-title">
            Page not found
          </h1>
          <p className="lead hero__lede">This address is not part of the Syndroo website.</p>
          <div className="hero__cta">
            <a className="button button--primary button--lg" href="/">
              Go to the homepage
            </a>
            <a className="button button--ghost button--lg" href="/zh/">
              中文首页
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
