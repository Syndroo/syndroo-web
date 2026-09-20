// Migrated verbatim from the former authored HTML page body by
// `scripts/migrate-pages.ts`. Header, main and footer come from app/layout.tsx.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy - Syndroo",
  description: "Draft privacy page for the Syndroo project site. Pending operational and legal review.",
  alternates: { canonical: "/privacy/" },
  openGraph: {
    type: "website",
    url: "/privacy/",
    title: "Privacy - Syndroo",
    description: "Draft privacy page for the Syndroo project site. Pending operational and legal review.",
  },
  twitter: { card: "summary" },
};

export default function PrivacyPage() {
  return (
    <>
<div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Legal</span>
          <h1>Privacy</h1>
          <p>This page is a structural draft. Its statements have not been reviewed against the project's operational reality.</p>
        </div>
      </div>

      <section className="section">
        <div className="wrap prose">
          <div className="draft-banner" role="note">
            <strong>{"Draft — pending operational and legal review"}</strong>
            <p>
              Nothing on this page has been approved. It exists so a reviewer can see the intended shape and depth of the
              privacy page. Any statement about data collection, retention, processors or legal bases must be replaced
              with verified operational fact before publication.
            </p>
          </div>

          <h2 id="summary">What this page will cover</h2>
          <ul>
            <li>What the project website itself collects, if anything, and why.</li>
            <li>What the Syndroo software processes when a self-hoster runs it on their own account.</li>
            <li>Where data is stored, who processes it, and for how long.</li>
            <li>How to request access, correction or deletion of personal data.</li>
            <li>How changes to the policy are announced and dated.</li>
          </ul>

          <h2 id="website">The project website</h2>
          <p>
            This site is a static prototype. As built, the pages load local files only, and the interactive demonstration
            runs in the browser without sending anything to a server. No account system, newsletter form or analytics
            script is included in this prototype.
          </p>
          <p>
            If the published site later adds analytics, hosting logs with retention, or an email form, this section must
            describe them explicitly, including purpose, legal basis and retention period. Until then, no such statement
            should be inferred from this draft.
          </p>

          <h2 id="software">The Syndroo software</h2>
          <p>
            Syndroo is self-hosted software. When you deploy it, the Worker runs in your own Cloudflare account and stores
            post and publication records in your own D1 database. Platform credentials are Worker secrets that you
            configure. The project does not operate a hosted service in this version, does not receive a copy of your
            database, and cannot read your credentials.
          </p>
          <p>
            Because the deployment belongs to the person running it, the operator of that deployment is responsible for the
            data it holds, including any personal data in post content, API keys and platform credentials.
          </p>

          <h2 id="third-parties">Platforms and third parties</h2>
          <p>
            Publishing sends content and credentials to the social platform you configured. Each platform applies its own
            terms and privacy policy to that data. A self-hoster who enables a platform should tell their users what is sent
            and to whom.
          </p>

          <h2 id="contact">Contact</h2>
          <p>
            Privacy questions about the project itself belong in GitHub Issues, alongside bug reports and feature requests.
            A dedicated contact route and a controller address have not been decided, and neither is invented here.
          </p>

          <h2 id="status">Status of this draft</h2>
          <p>
            This draft carries no effective date and no approval. Operational details and legal review are required before
            this page is published as an approved policy, and it should not be relied on for compliance purposes in the
            meantime.
          </p>

          <div className="in-page-nav">
            <a href="/terms/">Terms (draft)</a>
            <a href="/about/">About</a>
            <a href="https://github.com/Syndroo/syndroo/issues" rel="noreferrer">GitHub Issues</a>
          </div>
        </div>
      </section>
    </>
  );
}
