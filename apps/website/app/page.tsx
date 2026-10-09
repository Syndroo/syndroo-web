import type { Metadata } from "next";
import { ORIGIN_PLACEHOLDERS, PRODUCT_REPOSITORY, platforms, versions } from "@syndroo/content/site-data";

const DESCRIPTION =
  "Syndroo is a local command-line tool that publishes one document from your own machine: plain text to Bluesky, Threads, LinkedIn, and Mastodon, and articles to DEV.to.";

export const metadata: Metadata = {
  title: "Syndroo - publish from your terminal to five platforms",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Syndroo - publish from your terminal to five platforms",
    description: DESCRIPTION,
  },
  twitter: { card: "summary" },
};

const docs = ORIGIN_PLACEHOLDERS.docs;

const facts = [
  {
    term: "Runs as a command",
    detail: "Installed by building this repository, not from a registry.",
  },
  {
    term: "No hosted API",
    detail: "There is no Syndroo service sitting between you and the platforms.",
  },
  {
    term: "No background worker",
    detail: "Nothing runs on a server, and nothing runs on a schedule.",
  },
];

const faq = [
  {
    question: "Is Syndroo released yet?",
    answer: `Not yet. ${versions.cli} is an unpublished release candidate, and live-account acceptance is still pending. There is no registry install today, so the way to run it is to build it from source.`,
  },
  {
    question: "Which platforms does it publish to?",
    answer:
      "Five official providers. Bluesky, Threads, LinkedIn and Mastodon publish text; DEV.to publishes articles. A request carries the content once and a targets list that names the providers and, when it matters, the connection and the provider options.",
  },
  {
    question: "Where do my credentials live?",
    answer:
      "On your machine, never in the publish request. A connection reads its credentials once, from the environment variable SYNDROO_CREDENTIALS or from a private file you own, and the local credential store keeps them after that. Publishing never re-reads the environment or the file.",
  },
  {
    question: "What does the dry run actually do?",
    answer:
      "syndroo publish --input post.json --dry-run --json freezes and validates the request, prints the preview, then exits. It is optional and read-only: no write lock, no credentials resolved, no network request, and no local state.",
  },
  {
    question: "What gets sent when I publish?",
    answer:
      "The content is frozen when the request is prepared. Confirming sends exactly that frozen preview, so editing the file afterwards cannot change what goes out — and a later prepare is a new request with its own identity.",
  },
  {
    question: "Is there a Syndroo server involved?",
    answer:
      "Not in this path. The command talks to the platform APIs directly, from your machine, using the credentials you provide, and outbound requests are limited to the origins each provider declares. The product also contains a self-hosted server and an SDK; this site does not document them yet.",
  },
  {
    question: "How do I check what a run did?",
    answer:
      "syndroo status --operation <operationId> --json reports the operation and one delivery per target. A delivery is succeeded, failed with a not-applied disposition, or unknown; an unknown write is never retried automatically.",
  },
];

export default function IndexPage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="shell">
          <h1 className="hero__title" id="hero-title">
            <span className="title__ink">Write once,</span>{" "}
            <span className="title__dim">publish</span>
          </h1>
          <p className="lead hero__lede">
            A draft lives in one plain-text file in your repository.{" "}
            <strong>Syndroo reads that file and publishes it</strong> to Bluesky, Threads,
            LinkedIn, and Mastodon, and articles to DEV.to, from your terminal.
          </p>
          <div className="hero__cta">
            <a className="button button--primary button--lg" href={`${PRODUCT_REPOSITORY}#readme`}>
              Build from source
            </a>
          </div>
          <p className="note-line">
            v{versions.cli} &middot; {versions.releaseStage} &middot; live-account acceptance
            pending
          </p>
        </div>
      </section>

      <section className="platforms" id="platforms" aria-labelledby="platforms-title">
        <div className="shell">
          <h2 className="title title--left" id="platforms-title">
            <span className="title__ink">One draft.</span>
            <br />
            <span className="title__dim">Multiple destinations.</span>
          </h2>
          <div className="app-cards">
            {platforms.map((platform) => (
              <a
                className="app-card"
                key={platform.id}
                href={`${docs}/platforms/${platform.id}/`}
              >
                <span className={`app-icon app-icon--${platform.icon}`} aria-hidden="true">
                  {platform.label === undefined ? (
                    <span className={`mark mark--white mark--${platform.icon}`}></span>
                  ) : (
                    <span className="app-icon__text">{platform.label}</span>
                  )}
                </span>
                <span className="app-card__name">{platform.name}</span>
              </a>
            ))}
          </div>
          <div className="platform-copy">
            <p>
              Publish from one document: plain text to Bluesky and Threads, plain text from a
              personal LinkedIn profile, public Mastodon statuses, and public personal DEV.to
              articles. A request is strict JSON: <code>content.text</code> carries the text once
              and <code>targets</code> names each destination, with optional per-target{" "}
              <code>options</code> for the platforms that need them. An article target carries its
              own <code>title</code> and <code>body_markdown</code> options.
            </p>
            <p className="platform-fact">
              LinkedIn personal &middot; Mastodon public &middot; DEV.to public articles
            </p>
          </div>
        </div>
      </section>

      <section className="publish" id="workflow" aria-labelledby="publish-title">
        <div className="shell">
          <h2 className="title title--center" id="publish-title">
            Publish
          </h2>
          <div className="rows">
            <article className="row">
              <div className="row__copy">
                <h3>Write a request</h3>
                <p>
                  A request is a small JSON file you keep next to your project.{" "}
                  <code>content</code> is the text and <code>targets</code> names where it goes.
                </p>
              </div>
              <div className="visual">
                <div className="visual__head">
                  <span className="visual__title">Input file</span>
                  <span className="tag">Example</span>
                </div>
                <div className="panel panel--flat">
                  <p className="panel__head">post.json</p>
                  <pre className="code">
                    {"{\n  "}
                    <span className="code__key">&quot;content&quot;</span>
                    {": { "}
                    <span className="code__key">&quot;text&quot;</span>
                    {": "}
                    <span className="code__str">&quot;One document, chosen targets.&quot;</span>
                    {" },\n  "}
                    <span className="code__key">&quot;targets&quot;</span>
                    {": ["}
                    {"{ "}
                    <span className="code__key">&quot;provider&quot;</span>
                    {": "}
                    <span className="code__str">&quot;bluesky&quot;</span>
                    {" }, { "}
                    <span className="code__key">&quot;provider&quot;</span>
                    {": "}
                    <span className="code__str">&quot;linkedin&quot;</span>
                    {" }"}
                    {"]\n}"}
                  </pre>
                </div>
              </div>
            </article>

            <article className="row">
              <div className="row__copy">
                <h3>Preview before sending</h3>
                <p>
                  A dry run freezes and validates the request, then stops. It is optional and
                  read-only: no network request, no credentials resolved, no local state.
                </p>
              </div>
              <div className="visual visual--queue">
                <div className="visual__head">
                  <span className="visual__title">Dry run</span>
                  <span className="tag">Illustrative</span>
                </div>
                <div className="term">
                  <div className="term__bar">
                    <i></i>
                    <i></i>
                    <i></i>
                    <em>dry run</em>
                  </div>
                  <p>
                    <span className="term__prompt">$</span> syndroo publish --input post.json
                    --dry-run --json
                  </p>
                </div>
                <div className="panel">
                  Dry run &middot; no network requests &middot; no local state
                  <span className="panel__note">
                    Read the printed text and target account before continuing. Preparing a later
                    request freezes the input it read at that moment.
                  </span>
                </div>
                <img
                  className="mascot mascot--queue"
                  src="/assets/droo-queueing.png"
                  alt=""
                  width="190"
                  height="190"
                  decoding="async"
                />
              </div>
            </article>

            <article className="row">
              <div className="row__copy">
                <h3>Publish with intent</h3>
                <p>
                  Publishing is two phases. Preparing freezes the content and returns a single-use
                  approval token; executing consumes that token and sends exactly the frozen
                  preview.
                </p>
              </div>
              <div className="visual">
                <div className="visual__head">
                  <span className="visual__title">Send</span>
                  <span className="tag">Illustrative</span>
                </div>
                <div className="term">
                  <div className="term__bar">
                    <i></i>
                    <i></i>
                    <i></i>
                    <em>publish</em>
                  </div>
                  <p>
                    <span className="term__prompt">$</span> syndroo publish --input post.json
                  </p>
                  <p>
                    <span className="term__out">
                      frozen preview &middot; one approval token &middot; nothing sent yet
                    </span>
                  </p>
                  <p>
                    <span className="term__prompt">$</span> syndroo publish --input - &lt;
                    execute.json
                  </p>
                </div>
                <div className="panel">
                  Editing the file after preparing does not change what gets sent.
                  <span className="panel__note">
                    The execute phase can only be read from standard input.
                  </span>
                </div>
              </div>
            </article>

            <article className="row">
              <div className="row__copy">
                <h3>Inspect the result</h3>
                <p>
                  The publish result carries an operation id. Reading it back is a read-only
                  query, and it never contacts a platform:{" "}
                  <code>syndroo status --operation &lt;operationId&gt;</code>.
                </p>
              </div>
              <div className="visual">
                <div className="visual__head">
                  <span className="visual__title">Status</span>
                  <span className="tag">Illustrative</span>
                </div>
                <div className="term">
                  <div className="term__bar">
                    <i></i>
                    <i></i>
                    <i></i>
                    <em>status</em>
                  </div>
                  <p>
                    <span className="term__prompt">$</span> syndroo status --operation
                    6f2a&hellip;c41 --json
                  </p>
                </div>
                <div className="panel">
                  <pre className="receipt">
                    <span className="code__key">operationId</span>
                    {"  6f2a\u2026c41\n"}
                    <span className="code__key">status</span>
                    {"       succeeded\n"}
                    <span className="code__key">per target</span>
                    {"   deliveryId \u00b7 attempts \u00b7 outcome"}
                  </pre>
                  <span className="panel__note">
                    An unknown outcome is reported as unknown and is never retried automatically.
                    Live-account acceptance is still pending for this release candidate.
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="local" aria-labelledby="local-title">
        <div className="local__band">
          <div className="shell">
            <h2 className="title title--center" id="local-title">
              <span className="title__ink">Local</span>{" "}
              <span className="title__dim">by design</span>
            </h2>
            <p className="lead lead--center">
              Your draft is a file on your disk. Syndroo reads it when you run it, and sends it with
              the credentials you already have. What happens is whatever the last command you typed
              did.
            </p>
            <ul className="local__facts">
              {facts.map((fact) => (
                <li key={fact.term}>
                  <strong>{fact.term}</strong>
                  <span>{fact.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="workflow" aria-labelledby="workflow-title">
        <div className="shell">
          <div className="split">
            <div className="split__copy">
              <h2 className="title title--left" id="workflow-title">
                <span className="title__ink">Your workflow,</span>
                <br />
                <span className="title__dim">your terminal.</span>
              </h2>
              <p>
                No dashboard, no browser tab to keep open. Edit a file, run a command, read the
                result. Your editor, your shell, and your own platform credentials stay in charge.
              </p>
              <a className="button button--ghost" href="#workflow">
                See the commands
              </a>
            </div>
            <div className="terminal">
              <div className="term__bar">
                <i></i>
                <i></i>
                <i></i>
                <em>illustrative</em>
              </div>
              <p>
                <span className="term__prompt">$</span> $EDITOR post.json
              </p>
              <p>
                <span className="term__prompt">$</span> syndroo publish --input post.json --dry-run
                --json
              </p>
              <p>
                <span className="term__out">
                  dry run &middot; no network requests &middot; no local state
                </span>
              </p>
              <span className="terminal__gap"></span>
              <p>
                <span className="term__prompt">$</span> syndroo publish --input post.json
              </p>
              <p>
                <span className="term__out">
                  frozen &middot; awaiting confirmation &middot; posts to bluesky, linkedin
                </span>
              </p>
              <span className="terminal__gap"></span>
              <p>
                <span className="term__prompt">$</span> syndroo status --operation
                6f2a&hellip;c41 --json
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="faq" id="faq" aria-labelledby="faq-title">
        <div className="shell shell--narrow">
          <h2 className="title title--center" id="faq-title">
            FAQ
          </h2>
          <p className="lead lead--center">
            Where this release candidate stands, and the questions that come up most.
          </p>
          <div className="faq__list">
            {faq.map((item) => (
              <details className="faq__item" key={item.question}>
                <summary>
                  {item.question}
                  <span className="chevron" aria-hidden="true"></span>
                </summary>
                <div className="faq__body">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="get-started" id="get-started" aria-labelledby="get-started-title">
        <div className="shell">
          <img
            className="mascot get-started__mascot"
            src="/assets/droo-success.png"
            alt=""
            width="116"
            height="116"
            decoding="async"
          />
          <h2 className="title title--hero" id="get-started-title">
            Ready to get started
          </h2>
          <p className="lead lead--center">
            Build the release candidate from source, then publish your first post from the terminal.
          </p>
          <div className="get-started__actions">
            <a className="button button--primary button--lg" href={`${PRODUCT_REPOSITORY}#readme`}>
              Start
            </a>
          </div>
          <p className="note-line">
            v{versions.cli} &middot; {versions.releaseStage} &middot; build from source &middot;
            live-account acceptance pending
          </p>
        </div>
      </section>
    </>
  );
}
