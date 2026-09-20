// Migrated verbatim from the former authored HTML page body by
// `scripts/migrate-pages.ts`. Header, main and footer come from app/layout.tsx.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Syndroo",
  description: "Technical writing about cross-posting, idempotency and self-hosted publishing infrastructure from the Syndroo project.",
  alternates: { canonical: "/blog/" },
  openGraph: {
    type: "website",
    url: "/blog/",
    title: "Blog - Syndroo",
    description: "Technical writing about cross-posting, idempotency and self-hosted publishing infrastructure from the Syndroo project.",
  },
  twitter: { card: "summary" },
};

export default function BlogPage() {
  return (
    <>
<div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Blog</span>
          <h1>Notes on publishing infrastructure</h1>
          <p>
            Technical articles about the parts of cross-posting that are easy to get wrong: idempotency, ambiguous
            failures, text limits and the polling loop that ties them together. Everything here describes behaviour that
            exists in the repository, including the parts that are still unproven.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="post-list">
            <a className="post-card" href="/blog/safe-cross-posting-with-idempotency/">
              <span className="tag">Tutorial</span>
              <h2>Safe text cross-posting: idempotency keys, status polling and ambiguous failures</h2>
              <p>
                A request that returns <code>{"202"}</code> has been accepted, not published. This walkthrough builds a
                retry-safe cross-posting call that survives a timeout, avoids duplicate posts, and reads the final state
                back instead of assuming it.
              </p>
              <span className="post-card__meta">{"Engineering · 12 minute read · Covers POST /v1/posts and GET /v1/posts/{id}"}</span>
            </a>

            <a className="post-card" href="/changelog/">
              <span className="tag">Project notes</span>
              <h2>What changed in the 0.2.0-rc.1 candidate</h2>
              <p>
                The changelog tracks prepared work separately from anything published. It lists the released status of the
                candidate, the retry-timing migration, the local mock end-to-end gate and the platform adapters that are
                still experimental.
              </p>
              <span className="post-card__meta">{"Release notes · Maintained with the repository"}</span>
            </a>
          </div>

          <div className="note" style={{ marginTop: "32px" }}>
            <h3>No sponsored posts, no scheduled content</h3>
            <p>
              This list is intentionally short. Articles are written when there is something verified to explain, so the
              blog will grow slowly and each entry will point at the code or documentation it came from.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
