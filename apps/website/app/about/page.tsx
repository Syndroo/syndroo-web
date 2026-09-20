// Migrated verbatim from the former authored HTML page body by
// `scripts/migrate-pages.ts`. Header, main and footer come from app/layout.tsx.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Syndroo",
  description: "Why Syndroo exists: one API, self-hosted, open source publishing infrastructure you keep on your own account.",
  alternates: { canonical: "/about/" },
  openGraph: {
    type: "website",
    url: "/about/",
    title: "About - Syndroo",
    description: "Why Syndroo exists: one API, self-hosted, open source publishing infrastructure you keep on your own account.",
  },
  twitter: { card: "summary" },
};

export default function AboutPage() {
  return (
    <>
<div className="page-head">
        <div className="wrap">
          <span className="eyebrow">About</span>
          <h1>Publishing infrastructure you keep</h1>
          <p>
            Syndroo exists because posting the same thing in several places should be one API call, and because that call
            should run on infrastructure the caller controls.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="wrap prose">
          <h2 id="why">Why the project exists</h2>
          <p>
            Posting across platforms turns into four small problems at once. Each platform has its own authentication, its
            own text limit, its own failure modes, and its own idea of what "sent" means. When that logic lives inside an
            application, a retry after a timeout can quietly publish the same sentence twice, and nobody can tell which
            destination actually took it.
          </p>
          <p>
            Syndroo moves that logic behind one authenticated HTTP surface. A request names the platforms it wants, may
            carry per-platform wording, and gets back an identifier. Syndroo then writes one publication per platform,
            dispatches them, and records the outcome so the caller can read the result back instead of guessing.
          </p>

          <h2 id="principles">Design principles in the code</h2>
          <ul>
            <li>
              <strong>Self-hosted by default.</strong> You deploy the Worker into your own Cloudflare account and choose
              <code>{"SYNDROO_API_KEY"}</code> yourself. There is no hosted Syndroo service and no account with the project.
            </li>
            <li>
              <strong>Credentials stay yours.</strong> Platform credentials are Worker secrets in your deployment. Syndroo
              never holds them on the caller's behalf.
            </li>
            <li>
              <strong>Explicit platform enablement.</strong> A platform publishes only when its adapter is installed and
              its credentials are configured. Anything else returns <code>{"PLATFORM_NOT_CONFIGURED"}</code> before data is
              stored, instead of failing silently.
            </li>
            <li>
              <strong>One adapter per platform.</strong> Adding a platform means adding one adapter package and wiring one
              explicit switch in the Worker, which keeps the public contract stable as integrations grow.
            </li>
            <li>
              <strong>Ambiguity is surfaced, not smoothed over.</strong> A write that may have succeeded is marked
              ambiguous and never resent automatically. Automation should not invent certainty.
            </li>
            <li>
              <strong>Open source under Apache-2.0.</strong> The license, NOTICE and contribution policy are part of the
              repository, so self-hosting is a supported path rather than a tolerated one.
            </li>
          </ul>

          <h2 id="status">Where the project actually stands</h2>
          <p>
            The current version is <strong>0.2.0-rc.1</strong>, a release candidate that has not been published, tagged or
            deployed. It is an HTTP API with no web dashboard. Threads and Bluesky run against local mock servers in the
            end-to-end gate, and live-account acceptance is still pending. X, Tumblr and LinkedIn are implemented and
            unit-tested, and are labelled experimental until someone validates them against live accounts.
          </p>
          <p>
            The project is maintained in the open, and its caveats are published next to its features rather than in a
            footnote. The repository README, changelog and testing documentation are the reference for what each version
            does and what has been verified.
          </p>

          <h2 id="attribution">Copyright and attribution</h2>
          <ul className="meta-list">
            <li><span className="key">Project</span><span>Syndroo</span></li>
            <li><span className="key">Repository</span><span><a href="https://github.com/Syndroo/syndroo" rel="noreferrer">github.com/Syndroo/syndroo</a></span></li>
            <li><span className="key">License</span><span><a href="https://github.com/Syndroo/syndroo/blob/main/LICENSE" rel="noreferrer">Apache License 2.0</a>, with the repository NOTICE file</span></li>
            <li><span className="key">Copyright</span><span>Copyright 2026 Grant Dai</span></li>
            <li><span className="key">Contact</span><span><a href="https://github.com/Syndroo/syndroo/issues" rel="noreferrer">GitHub Issues</a></span></li>
            <li><span className="key">Mark</span><span>An interim project mark used while the final logo direction is still open</span></li>
          </ul>
          <p>
            Third-party components keep their own licenses. The bundled Worker distributes generated third-party license
            text, and the changelog records the one dependency whose upstream licensing needed an explicit supplement.
          </p>

          <h2 id="contribute">Contributing</h2>
          <p>
            The repository uses a Developer Certificate of Origin policy: commits are signed off, and contributions follow
            the same verification gates as the rest of the tree. Bug reports and questions belong in GitHub Issues.
          </p>

          <div className="in-page-nav">
            <a href="https://github.com/Syndroo/syndroo" rel="noreferrer">GitHub</a>
            <a href="https://github.com/Syndroo/syndroo/issues" rel="noreferrer">Issues</a>
            <a href="/changelog/">Changelog</a>
            <a href="http://localhost:4174/">Documentation</a>
          </div>
        </div>
      </section>
    </>
  );
}
