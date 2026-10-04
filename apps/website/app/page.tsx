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
      "Only five. Bluesky and Threads take plain text; LinkedIn takes plain text from a personal profile; Mastodon publishes public statuses; DEV.to publishes public personal articles. A document names its destinations, and an overrides block can tailor the text for one platform without changing the document's identity.",
  },
  {
    question: "Where do my credentials live?",
    answer:
      "On your machine, never in the post file. A run reads a credential from the environment or from a private file you own, and local state stores only a reference to the account, not the platform secret.",
  },
  {
    question: "What does the dry run actually do?",
    answer:
      "syndroo publish --input post.json --dry-run --json parses and validates the document, then exits. It is optional and read-only: no session lock, no credentials resolved, no network request, and no local state.",
  },
  {
    question: "What gets sent when I publish?",
    answer:
      "A publish reads the current input, not a saved preview. Within the run the file is read once and validated, so editing it during the confirmation cannot change what is sent.",
  },
  {
    question: "Is there a Syndroo server involved?",
    answer:
      "No. There is no hosted API, no SDK, and no SaaS in the path. The command talks to the platform APIs directly using the credentials you provide.",
  },
  {
    question: "How do I check what a run did?",
    answer:
      "Inspect recorded publish results by operation ID with syndroo receipts show <result.operationId>. Each target gets its own receipt; dry runs create no receipt and no local state.",
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
              <article className="app-card" key={platform.id}>
                <span className={`app-icon app-icon--${platform.icon}`} aria-hidden="true">
                  {platform.label === undefined ? (
                    <span className={`mark mark--white mark--${platform.icon}`}></span>
                  ) : (
                    <span className="app-icon__text">{platform.label}</span>
                  )}
                </span>
                <span className="app-card__name">{platform.name}</span>
              </article>
            ))}
          </div>
          <div className="platform-copy">
            <p>
              Publish from one document: plain text to Bluesky and Threads, plain text from a
              personal LinkedIn profile, public Mastodon statuses, and public personal DEV.to
              articles. A document is strict JSON: <code>key</code> identifies the post,{" "}
              <code>content</code> is the text, and <code>platforms</code> names the destinations.
              An <code>overrides</code> block can tailor the text for one platform, and a{" "}
              <code>schemaVersion: 2</code> document carries the DEV.to article body.
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
                <h3>Write a plain-text post</h3>
                <p>
                  A post is a small JSON document you keep next to your project. <code>key</code>{" "}
                  identifies it, <code>content</code> is the text, and <code>platforms</code> names
                  where it goes.
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
                    <span className="code__key">&quot;key&quot;</span>
                    {": "}
                    <span className="code__str">&quot;hello-001&quot;</span>
                    {",\n  "}
                    <span className="code__key">&quot;content&quot;</span>
                    {": "}
                    <span className="code__str">&quot;One document, chosen targets.&quot;</span>
                    {",\n  "}
                    <span className="code__key">&quot;platforms&quot;</span>
                    {": ["}
                    <span className="code__str">&quot;bluesky&quot;</span>
                    {", "}
                    <span className="code__str">&quot;threads&quot;</span>
                    {", "}
                    <span className="code__str">&quot;linkedin&quot;</span>
                    {"]\n}"}
                  </pre>
                </div>
              </div>
            </article>

            <article className="row">
              <div className="row__copy">
                <h3>Preview before sending</h3>
                <p>
                  A dry run parses and validates the document, then stops. It is optional and
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
                    Read the printed text and target account before continuing. A later publish
                    reads the current input, not a saved preview.
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
                  Publishing is an explicit command that reads the current input rather than reusing
                  a saved preview. Within a run the file is read once, so editing it during the
                  confirmation cannot change what is sent.
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
                      reads post.json once &middot; one content request per target
                    </span>
                  </p>
                </div>
                <div className="panel">
                  Editing the file after a dry run changes what gets sent.
                  <span className="panel__note">A publish does not reuse a saved preview.</span>
                </div>
              </div>
            </article>

            <article className="row">
              <div className="row__copy">
                <h3>Inspect the result</h3>
                <p>
                  Each publish records one receipt per target, readable with{" "}
                  <code>syndroo receipts show &lt;result.operationId&gt;</code>.
                </p>
              </div>
              <div className="visual">
                <div className="visual__head">
                  <span className="visual__title">Receipt</span>
                  <span className="tag">Illustrative</span>
                </div>
                <div className="term">
                  <div className="term__bar">
                    <i></i>
                    <i></i>
                    <i></i>
                    <em>receipts</em>
                  </div>
                  <p>
                    <span className="term__prompt">$</span> syndroo receipts show 6f2a&hellip;c41
                  </p>
                </div>
                <div className="panel">
                  <pre className="receipt">
                    <span className="code__key">operationId</span>
                    {"  6f2a\u2026c41\n"}
                    <span className="code__key">key</span>
                    {"          hello-001\n"}
                    <span className="code__key">per target</span>
                    {"   status \u00b7 attempts \u00b7 url"}
                  </pre>
                  <span className="panel__note">
                    Dry runs create no receipt and no local state. Live-account acceptance is still
                    pending for this release candidate.
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
                receipt. Your editor, your shell, and your own platform credentials stay in charge.
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
                  read once &middot; posts to bluesky, threads, linkedin
                </span>
              </p>
              <span className="terminal__gap"></span>
              <p>
                <span className="term__prompt">$</span> syndroo receipts show 6f2a&hellip;c41
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
