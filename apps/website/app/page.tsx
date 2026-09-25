// The single marketing page: what the CLI does, the three steps it takes to
// publish, and which platforms it reaches. Header and footer come from
// app/layout.tsx.
import type { Metadata } from "next";
import { ORIGIN_PLACEHOLDERS, platforms, versions } from "@syndroo/content/site-data";

const DESCRIPTION =
  "Publish text to Bluesky and Threads from your own machine: configure an account, preview the post, then confirm the publish.";

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
        <div className="wrap hero__grid">
          <div className="hero__intro">
            <span className="pill">
              <span className="dot" aria-hidden="true"></span>
              <strong>{versions.cli}</strong> {versions.releaseStage}
            </span>
            <h1>Publish text to Bluesky and Threads from your CLI.</h1>
            <p className="hero__subtitle">
              One command previews the post and one command sends it. Nothing reaches a platform until you confirm the
              frozen plan.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href={`${docs}/`}>
                Get started
              </a>
              <a className="button button--ghost" href={`${docs}/commands/`}>
                Command reference
              </a>
            </div>
            <p className="hero__boundary">
              <strong>Where this stands:</strong> release candidate; live-account testing pending.
            </p>
          </div>

          <div className="hero__visual">
            <div className="hero__mascot">
              <span className="hero__mascot-glow" aria-hidden="true"></span>
              <img
                className="demo__mascot"
                src="/assets/droo-publishing.png"
                alt="Droo, the Syndroo mascot, jumping as one post fans out to platform cards"
                width="320"
                height="320"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Three steps</span>
            <h2>Configure, preview, publish</h2>
          </div>
          <div className="grid grid--3">
            <article className="card">
              <span className="card__step">01</span>
              <h3>Configure an account</h3>
              <p>Connect your Bluesky or Threads account.</p>
            </article>
            <article className="card">
              <span className="card__step">02</span>
              <h3>Preview the post</h3>
              <p>
                <code>syndroo publish --input post.json --dry-run</code> writes a frozen plan and sends nothing.
              </p>
            </article>
            <article className="card">
              <span className="card__step">03</span>
              <h3>Confirm the publish</h3>
              <p>Publishes the plan you approved.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="platform-strip" aria-labelledby="platforms-title">
        <div className="wrap">
          <div className="platform-strip__head">
            <p className="platform-strip__title" id="platforms-title">
              Bluesky and Threads &middot; plain text
            </p>
          </div>
          <ul className="platform-tiles">
            {platforms.map((platform) => (
              <li key={platform.id}>
                <a className="platform-tile" href={`${docs}/accounts/`}>
                  <span className={`platform-icon platform-icon--${platform.icon}`} aria-hidden="true"></span>
                  <span className="platform-tile__name">{platform.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
