import type { Metadata } from "next";
import { ORIGIN_PLACEHOLDERS, platforms, versions } from "@syndroo/content/site-data";

const DESCRIPTION =
  "Syndroo is a local command-line tool that publishes plain text to Bluesky and Threads from your own machine: bind an account, publish in one command, and preview first whenever you want.";

export const metadata: Metadata = {
  title: "Syndroo - publish text to Bluesky and Threads from the CLI",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Syndroo - publish text to Bluesky and Threads from the CLI",
    description: DESCRIPTION,
  },
  twitter: { card: "summary" },
};

const docs = ORIGIN_PLACEHOLDERS.docs;

export default function IndexPage() {
  return (
    <>
      <section className="hero">
        <div className="shell">
          <p className="pill">
            <span className="dot" aria-hidden="true"></span>
            <strong>{versions.cli}</strong> {versions.releaseStage}
          </p>
          <h1 className="hero__title">
            <span>Write once.</span>
            <span>Publish from your terminal.</span>
          </h1>
          <p className="hero__lede">
            Syndroo is a local command-line tool. It posts plain text to Bluesky and Threads from this machine, in the
            foreground, with no server in the path.
          </p>
          <div className="hero__actions">
            <a className="button button--primary" href={`${docs}/`}>
              Get started
            </a>
            <a className="button button--ghost" href={`${docs}/commands/`}>
              Command reference
            </a>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="shell band__inner">
          <figure className="band__figure">
            <img
              src="/assets/droo-publishing.png"
              alt="Droo, the Syndroo mascot, sending one post to several platform cards"
              width="250"
              height="250"
              fetchPriority="high"
              decoding="async"
            />
            <figcaption>One document, one publish run.</figcaption>
          </figure>
          <div>
            <div className="term">
              <div className="term__head">
                <span className="term__title">Preview example</span>
                <span className="term__flag">Nothing sent</span>
              </div>
              <pre>
                <code>
                  <span className="term__cmd">syndroo publish</span> --input post.json --dry-run --json
                </code>
              </pre>
              <p className="term__note">
                A dry run parses and validates the document, prints the parsed result, and exits. It sends nothing and
                writes no local state. A later publish run reads the file again.
              </p>
            </div>
            <div className="status-row">
              <span className="status-chip">
                <strong>{versions.cli}</strong> unpublished candidate
              </span>
              <span className="status-chip">Live-account testing pending</span>
              {platforms.map((platform) => (
                <a key={platform.id} className="status-chip" href={`${docs}/accounts/`}>
                  <span
                    className={`platform-icon platform-icon--sm platform-icon--${platform.icon}`}
                    aria-hidden="true"
                  ></span>
                  {platform.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <h2 className="section__title">From draft to delivery.</h2>
          <p className="section__sub">
            Three steps, all on this machine. The CLI reads the file once and reports what happened for each target.
          </p>
          <div className="flow">
            <div className="steps">
              <article className="step">
                <span className="step__num">01</span>
                <h3>Bind an account</h3>
                <p>Bind a Bluesky or Threads account locally. Credentials stay in the environment the CLI runs in.</p>
                <p>
                  <code>syndroo auth set bluesky --local --from-env</code>
                </p>
              </article>
              <article className="step">
                <span className="step__num">02</span>
                <h3>Preview and publish</h3>
                <p>
                  Preview the document with a dry run, which sends nothing. A publish run reads the file again when you
                  are ready.
                </p>
                <p>
                  <code>syndroo publish --input post.json</code>
                </p>
              </article>
              <article className="step">
                <span className="step__num">03</span>
                <h3>Read the receipt</h3>
                <p>Each target reports its own status, attempts, remote id and url.</p>
                <p>
                  <code>syndroo receipts show &lt;result.operationId&gt;</code>
                </p>
              </article>
            </div>
            <figure className="flow__figure">
              <img
                src="/assets/droo-queueing.png"
                alt="Droo, the Syndroo mascot, holding a document beside a tray of results"
                width="190"
                height="190"
                decoding="async"
              />
              <figcaption>Step 02 hands one parsed document to each selected target.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="shell cta__inner">
          <img
            className="cta__mascot"
            src="/assets/droo-success.png"
            alt="Droo, the Syndroo mascot, giving a thumbs up"
            width="116"
            height="116"
            decoding="async"
          />
          <div>
            <h2>Your next post starts here.</h2>
            <p>Build the CLI locally, bind one account, and publish your first document in the foreground.</p>
            <div className="cta__actions">
              <a className="button button--primary" href={`${docs}/`}>
                Read the documentation
              </a>
              <a className="button button--ghost" href="https://github.com/Syndroo/syndroo" rel="noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
