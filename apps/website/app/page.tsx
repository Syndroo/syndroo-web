// Migrated verbatim from the former authored HTML page body by
// `scripts/migrate-pages.ts`. Header, main and footer come from app/layout.tsx.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syndroo - self-hosted publishing for AI agents and scripts",
  description: "Syndroo accepts a post once, queues one publication per platform, and reports what each platform did. Open-source HTTP API, self-hosted on your own Cloudflare account.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Syndroo - self-hosted publishing for AI agents and scripts",
    description: "One HTTP API accepts a post, queues one publication per platform, and reports what each platform did. Open source and self-hosted.",
  },
  twitter: { card: "summary" },
};

export default function IndexPage() {
  return (
    <>
<section className="hero">
        <div className="wrap hero__grid">
          <div className="hero__intro">
            <span className="pill"
              ><span className="dot" aria-hidden="true"></span><strong>0.2.0-rc.1</strong> Unpublished release
              candidate</span>
            <h1>{"Publish from your AI agent."}</h1>
            <p className="hero__subtitle">
              Give your agent or script one authenticated HTTP call. Syndroo accepts the post, queues one publication per
              platform, and reports what each platform actually did.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="http://localhost:4174/agent-setup/">Set up your agent</a>
              <a className="button button--ghost" href="http://localhost:4174/api/">Explore the API</a>
            </div>
            <p className="hero__proof">
              <span>Self-hosted on your Cloudflare account</span>
              <span>Bring your own platform credentials</span>
              <span>Text publishing</span>
            </p>
            <p className="hero__boundary">
              <strong>Where this stands:</strong> agent setup today means wiring your own agent to the documented HTTP API.
              Syndroo ships no skill, plugin or MCP server yet, and no platform client has passed live-account acceptance.
            </p>
          </div>

          <div className="hero__visual">
            {/* The mascot moved out of the demo title row into the hero brand
                area, where it has real layout space. The glow is its own layer
                behind the artwork, and the image itself is not cropped. */}
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

            <div className="demo" id="demo" data-demo>
            <div className="demo__head">
              <div className="demo__head-text">
                <h2 className="demo__title">One request, four documented outcomes</h2>
                <p className="demo__subtitle">
                  The same scenario drives both views: what your agent shows you, and what the API returns at each step.
                </p>
              </div>
            </div>

            <p className="simulated demo__simulated">Simulated - no posts are sent</p>

            <noscript>
              <p className="demo__noscript">
                The interactive demo needs JavaScript. Nothing here is required to use Syndroo:
                <a href="http://localhost:4174/agent-setup/">the agent setup guide</a> shows the same request and responses
                as copyable text, and <a href="http://localhost:4174/api/">the API reference</a> lists every field, status
                and error code.
              </p>
            </noscript>

            <div className="picker" data-demo-picker role="group" aria-label="Demo scenario"></div>

            <div className="viewswitcher" role="group" aria-label="Demo view">
              <button type="button" className="viewswitcher__option" data-demo-view="agent" aria-pressed="true">
                Agent view
              </button>
              <button type="button" className="viewswitcher__option" data-demo-view="api" aria-pressed="false">API view</button>
            </div>

            <div className="demo__controls">
              <button className="button button--primary" type="button" data-demo-run>Run demo</button>
              <button
                className="button button--ghost"
                type="button"
                data-demo-pause
                aria-pressed="false"
                aria-disabled="true"
              >
                Pause
              </button>
              <button className="button button--ghost" type="button" data-demo-replay>Replay</button>
              <button className="button button--ghost" type="button" data-demo-reset>Reset</button>
              <button className="copy-button" type="button" data-demo-copy>Copy request</button>
              <span className="copy-feedback" data-demo-copy-feedback role="status" aria-live="polite"></span>
            </div>

            <p className="demo__state" data-demo-status role="status" aria-live="polite">Ready. Nothing has been sent.</p>

            <p className="demo__summary" data-demo-summary></p>

            <div className="demo__view" data-demo-panel="agent">
              <h3 className="demo__view-title">What the agent shows you</h3>
              <ol className="conversation" data-demo-conversation aria-live="polite"></ol>
              <p className="demo__boundary" data-demo-boundary></p>
            </div>

            <div className="demo__view" data-demo-panel="api" hidden>
              <h3 className="demo__view-title">What the API returns</h3>
              <div className="console">
                <div className="console__bar">
                  <span className="console__method">POST</span>
                  <span className="tag" data-demo-path>/v1/posts</span>
                  <span className="tag tag--muted" data-demo-key></span>
                </div>
                <div className="console__body">
                  <pre><code data-demo-request></code></pre>
                </div>
              </div>
              <div className="console demo__receipt">
                <div className="console__bar">
                  <span className="console__method console__method--get">HTTP</span>
                  <span className="tag" data-demo-response-label>No response yet</span>
                </div>
                <div className="console__body">
                  <pre><code data-demo-response></code></pre>
                </div>
              </div>
              <details className="demo__status-panel">
                <summary>Show the status response</summary>
                <div className="console">
                  <div className="console__bar">
                    <span className="console__method console__method--get">GET</span>
                    <span className="tag">{"/v1/posts/{id}"}</span>
                    <span className="tag tag--muted">Simulated query</span>
                  </div>
                  <div className="console__body">
                    <pre><code data-demo-status-body></code></pre>
                  </div>
                </div>
              </details>
            </div>

            <div className="demo__results">
              <h3 className="demo__view-title">Per-platform results</h3>
              <ul className="results" data-demo-results></ul>
              <p className="demo__caution" data-demo-caution></p>
            </div>

            </div>
          </div>
        </div>
      </section>

      <section className="platform-strip" id="platforms" aria-labelledby="platforms-title">
        <div className="wrap">
          <div className="platform-strip__head">
            <p className="platform-strip__title" id="platforms-title">Available adapters in the 0.2.0-rc.1 candidate</p>
            <p className="platform-strip__note">
              Text only. No platform has a live-account acceptance record yet, so each one keeps its honest status.
            </p>
          </div>
          <ul className="platform-tiles">
            <li>
              <a className="platform-tile" href="http://localhost:4174/platforms/bluesky/">
                <span className="platform-icon platform-icon--bluesky" aria-hidden="true"></span>
                <span className="platform-tile__name">Bluesky</span>
                <span className="status-tag status-tag--tested">Mock-tested</span>
              </a>
            </li>
            <li>
              <a className="platform-tile" href="http://localhost:4174/platforms/threads/">
                <span className="platform-icon platform-icon--threads" aria-hidden="true"></span>
                <span className="platform-tile__name">Threads</span>
                <span className="status-tag status-tag--tested">Mock-tested</span>
              </a>
            </li>
            <li>
              <a className="platform-tile" href="http://localhost:4174/platforms/x/">
                <span className="platform-icon platform-icon--x" aria-hidden="true"></span>
                <span className="platform-tile__name">X</span>
                <span className="status-tag status-tag--experimental">Experimental</span>
              </a>
            </li>
            <li>
              <a className="platform-tile" href="http://localhost:4174/platforms/tumblr/">
                <span className="platform-icon platform-icon--tumblr" aria-hidden="true"></span>
                <span className="platform-tile__name">Tumblr</span>
                <span className="status-tag status-tag--experimental">Experimental</span>
              </a>
            </li>
            <li>
              <a className="platform-tile" href="http://localhost:4174/platforms/linkedin/">
                <span className="platform-icon platform-icon--linkedin" aria-hidden="true"></span>
                <span className="platform-tile__name">LinkedIn</span>
                <span className="status-tag status-tag--experimental">Experimental</span>
              </a>
            </li>
          </ul>
          <p className="legend">
            Each guide lists the credentials that platform needs and what has actually been verified.
            <a href="http://localhost:4174/platforms/bluesky/">Start with Bluesky</a>.
          </p>
        </div>
      </section>

      <section className="section section--tight" id="agent-entry">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Agent setup</span>
            <h2>Connect an agent, not an account</h2>
            <p className="lead">
              Syndroo is an endpoint, not a hosted service. Your agent holds its own instructions; the Worker holds the
              platform credentials and does the publishing.
            </p>
          </div>
          <div className="grid grid--3">
            <article className="card">
              <span className="status-tag status-tag--tested">Documented</span>
              <h3>Manual HTTP workflow</h3>
              <p>
                Any agent or script that can send HTTPS calls <code>{"POST /v1/posts"}</code> with your Bearer token. You
                confirm the text before it leaves the client.
              </p>
              <p className="card__link"><a href="http://localhost:4174/agent-setup/">Read the agent setup guide</a></p>
            </article>
            <article className="card">
              <span className="status-tag status-tag--experimental">Not built</span>
              <h3>Skill or plugin</h3>
              <p>
                No Syndroo-authored skill, plugin or tool package exists for this candidate. There is nothing to install,
                and no fake install command is published here.
              </p>
              <p className="card__link"><a href="http://localhost:4174/agent-setup/">See what is verified</a></p>
            </article>
            <article className="card">
              <span className="status-tag status-tag--experimental">Out of scope</span>
              <h3>MCP server</h3>
              <p>
                This version ships no MCP server and no SDK package. The supported interface is the documented HTTP API.
              </p>
              <p className="card__link"><a href="http://localhost:4174/api/">Read the API reference</a></p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Acceptance, delivery and failure are three different things</h2>
            <p className="lead">
              The reply to a request is an acceptance receipt, not a delivery report. That is why it says
              <code>{"queued"}</code>, and why every platform keeps its own stored status that you can read back.
            </p>
          </div>

          <div className="infra">
            <div className="infra__row">
              <h3>One accepted request, one publication per platform</h3>
              <p>
                <code>{"POST /v1/posts"}</code> validates the request and stores one row per selected platform, then answers
                with HTTP <code>{"202"}</code> and <code>{"status: \"queued\""}</code>. That receipt does not confirm platform
                success, and it is not proof that a platform has not published yet; only the post's own status and
                publications tell you what happened.
              </p>
            </div>
            <div className="infra__row">
              <h3>Delivery happens in the background</h3>
              <p>
                A Queue consumer claims one publication and calls that platform once. A failure on one platform never
                re-sends the platforms that already succeeded.
              </p>
            </div>
            <div className="infra__row">
              <h3>Retries are bounded and explicit</h3>
              <p>
                A retryable failure waits at least 60 seconds, then 120, and stops after three total attempts. A
                timed-out write is recorded as ambiguous and is never resent automatically.
              </p>
            </div>
            <div className="infra__row">
              <h3>You can always read the result back</h3>
              <p>
                <code>{"GET /v1/posts/{id}"}</code> returns the post status plus every platform's own status, error code and
                identifier, so automation can stay honest about what happened. Scheduling uses the same surface:
                <code>{"scheduledAt"}</code> is scanned by a Cron Trigger every 15 minutes.
              </p>
            </div>
          </div>

          <details className="tech-note">
            <summary>What it runs on</summary>
            <p>
              A Cloudflare Worker with D1 for the stored post and publications, Queues for immediate delivery, a Cron
              Trigger for scheduled work, and one explicit adapter switch per platform. Unconfigured platforms are
              rejected with <code>{"422"}</code> and <code>{"PLATFORM_NOT_CONFIGURED"}</code> before anything is stored.
            </p>
          </details>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Recipes</span>
            <h2>Three jobs people actually run</h2>
            <p className="lead">
              Each recipe has its inputs, the exact request, the expected responses, and what to do when a platform fails.
            </p>
          </div>
          <div className="grid grid--3">
            <article className="card">
              <span className="card__step">01</span>
              <h3>Ship a product update</h3>
              <p>Post a release note from your own machine or pipeline, with a shorter first line for Bluesky.</p>
              <p className="card__link"><a href="http://localhost:4174/recipes/product-update/">Product update recipe</a></p>
            </article>
            <article className="card">
              <span className="card__step">02</span>
              <h3>Summarize a blog post</h3>
              <p>Summarize the article in your own client, then publish the summary to the platforms you chose.</p>
              <p className="card__link"><a href="http://localhost:4174/recipes/blog-distribution/">Blog summary recipe</a></p>
            </article>
            <article className="card">
              <span className="card__step">03</span>
              <h3>Call it from CI</h3>
              <p>Send one authenticated request from a pipeline step and poll the post until it reaches a terminal state.</p>
              <p className="card__link"><a href="http://localhost:4174/recipes/api-automation/">CI and script recipe</a></p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Why Syndroo</span>
            <h2>Boring answers to the parts that go wrong</h2>
          </div>
          <div className="grid grid--3">
            <article className="card">
              <h3>Ownership stays with you</h3>
              <p>
                You deploy the Worker into your own Cloudflare account and choose <code>{"SYNDROO_API_KEY"}</code>. Platform
                credentials stay in your secrets.
              </p>
            </article>
            <article className="card">
              <h3>Retries stay honest</h3>
              <p>
                An optional <code>{"Idempotency-Key"}</code> ties one key to one logical post: a replay returns the original
                result, while the same key with different content returns <code>{"409"}</code>.
              </p>
            </article>
            <article className="card">
              <h3>Ambiguity stays visible</h3>
              <p>
                A timed-out platform call is stored as failed with <code>{"errorAmbiguous: true"}</code>. Nothing is resent
                automatically, and a person decides what happens next.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2>A few things to know</h2>
          </div>
          <div className="faq">
            <details>
              <summary>Is 0.2.0-rc.1 released?</summary>
              <p>
                No. It is prepared in the repository but not published, tagged, deployed or accepted as a release.
              </p>
            </details>
            <details>
              <summary>Do I need a Syndroo account?</summary>
              <p>
                No. You deploy the Worker to your own Cloudflare account, set your own <code>{"SYNDROO_API_KEY"}</code>, and
                add platform credentials as secrets.
              </p>
            </details>
            <details>
              <summary>Is there a Syndroo skill, plugin or MCP server?</summary>
              <p>
                No. The interface is the documented HTTP API. Agent setup means pointing your own agent or script at your
                deployment; no installable Syndroo package exists for this candidate.
              </p>
            </details>
            <details>
              <summary>Which platforms work right now?</summary>
              <p>
                Bluesky and Threads are exercised locally by the Mock SNS end-to-end gate and have no live-account
                acceptance record yet. X, Tumblr and LinkedIn are experimental. Unconfigured platforms return
                <code>{"PLATFORM_NOT_CONFIGURED"}</code>.
              </p>
            </details>
            <details>
              <summary>Can I publish images or video?</summary>
              <p>No. Every installed adapter is text only, with per-platform length limits enforced before publishing.</p>
            </details>
            <details>
              <summary>What happens if a platform call fails?</summary>
              <p>
                Retryable failures wait at least 60 seconds, then 120, up to three attempts in total. Ambiguous outcomes
                are never retried automatically.
              </p>
            </details>
            <details>
              <summary>How precise is scheduling?</summary>
              <p>
                <code>{"scheduledAt"}</code> takes an ISO date-time with an explicit timezone. Cron looks for due posts every
                15 minutes, and queue and platform time are added on top, so the requested time is the earliest intended
                time rather than a promised delivery time.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta">
            <div>
              <h2>Start with one platform</h2>
              <p>
                Deploy your Worker, configure one platform's credentials, and send one post you are happy to see in public.
                The first-post guide takes one platform end to end.
              </p>
              <div className="cta__actions" style={{ marginTop: "22px" }}>
                <a className="button button--primary" href="http://localhost:4174/quickstart/">Publish your first post</a>
                <a className="button button--ghost" href="http://localhost:4174/operations/cloudflare/">Deploy the Worker</a>
              </div>
            </div>
            <div className="cta__mascot">
              <img
                src="/assets/droo-success.png"
                alt="Droo, the Syndroo mascot, smiling beside a green confirmation check"
                width="96"
                height="96"
                loading="lazy"
                decoding="async"
               />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
