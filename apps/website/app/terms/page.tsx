// Migrated verbatim from the former authored HTML page body by
// `scripts/migrate-pages.ts`. Header, main and footer come from app/layout.tsx.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms - Syndroo",
  description: "Draft terms page for the Syndroo project site. Pending legal review.",
  alternates: { canonical: "/terms/" },
  openGraph: {
    type: "website",
    url: "/terms/",
    title: "Terms - Syndroo",
    description: "Draft terms page for the Syndroo project site. Pending legal review.",
  },
  twitter: { card: "summary" },
};

export default function TermsPage() {
  return (
    <>
<div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Legal</span>
          <h1>Terms</h1>
          <p>This page is a structural draft. It states no warranties, guarantees or liability positions that have been reviewed.</p>
        </div>
      </div>

      <section className="section">
        <div className="wrap prose">
          <div className="draft-banner" role="note">
            <strong>{"Draft — pending legal review"}</strong>
            <p>
              Nothing on this page has been approved or dated. It shows the intended structure of the terms page so a
              reviewer can assess scope. Any operative clause must be written and reviewed before publication.
            </p>
          </div>

          <h2 id="software-license">The software keeps its own license</h2>
          <p>
            Syndroo itself is licensed under the Apache License 2.0, together with the NOTICE file in the repository. That
            license governs use, modification and redistribution of the software. These site terms do not replace it, and
            where they appear to conflict, the license governs the software.
          </p>
          <p>
            Copyright 2026 Grant Dai. Third-party components remain under their own licenses, and the bundled Worker
            distributes generated third-party license text.
          </p>

          <h2 id="purpose">What these terms will cover</h2>
          <ul>
            <li>The scope of this website and any hosted documentation published with it.</li>
            <li>The boundary between the project and a self-hosted deployment run by someone else.</li>
            <li>Acceptable use of project-operated resources, such as the issue tracker.</li>
            <li>How contributions, trademarks and project marks are handled.</li>
            <li>How changes to these terms are announced and dated.</li>
          </ul>

          <h2 id="self-hosting">Self-hosted deployments</h2>
          <p>
            This version of Syndroo has no hosted service. Whoever deploys the Worker operates it, configures its secrets,
            and is responsible for the content published through it, for compliance with each social platform's terms, and
            for any data their deployment stores.
          </p>
          <p>
            The project does not operate, supervise or guarantee a third party's deployment, and it has no ability to read
            or remove content published through one.
          </p>

          <h2 id="no-promises">No service commitments are made here</h2>
          <p>
            The current version is an unpublished release candidate. It has no uptime commitment, no support agreement and
            no compatibility promise. Platform integrations may change or stop working when a platform changes its own
            API, credentials or policies. Ongoing release status, including which platforms have been validated, is tracked
            in the repository changelog.
          </p>

          <h2 id="contact">Contact</h2>
          <p>
            Questions about these terms belong in GitHub Issues. A formal legal contact and governing-law clause have not
            been decided, and neither is invented here.
          </p>

          <h2 id="status">Status of this draft</h2>
          <p>
            This draft carries no effective date and no approval. Operational details and legal review are required before
            this page is published as an approved policy, and it should not be relied on as a contract in the meantime.
          </p>

          <div className="in-page-nav">
            <a href="/privacy/">Privacy (draft)</a>
            <a href="https://github.com/Syndroo/syndroo/blob/main/LICENSE" rel="noreferrer">Apache-2.0 license text</a>
            <a href="/about/">About</a>
          </div>
        </div>
      </section>
    </>
  );
}
