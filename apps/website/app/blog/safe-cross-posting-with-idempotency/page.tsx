// Migrated verbatim from the former authored HTML page body by
// `scripts/migrate-pages.ts`. Header, main and footer come from app/layout.tsx.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safe text cross-posting: idempotency keys, status polling and ambiguous failures - Syndroo",
  description: "Build a retry-safe cross-posting call with the Syndroo HTTP API: stable idempotency keys, 202 semantics, status polling and ambiguous outcomes.",
  alternates: { canonical: "/blog/safe-cross-posting-with-idempotency/" },
  openGraph: {
    type: "website",
    url: "/blog/safe-cross-posting-with-idempotency/",
    title: "Safe text cross-posting: idempotency keys, status polling and ambiguous failures - Syndroo",
    description: "Build a retry-safe cross-posting call with the Syndroo HTTP API: stable idempotency keys, 202 semantics, status polling and ambiguous outcomes.",
  },
  twitter: { card: "summary" },
};

export default function BlogSafeCrossPostingWithIdempotencyPage() {
  return (
    <>
<div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Tutorial</span>
          <h1>Safe text cross-posting: idempotency keys, status polling and ambiguous failures</h1>
          <p>
            <span className="tag" style={{ marginRight: "10px" }}>Engineering</span>
            Describes the 0.2.0-rc.1 candidate, which is prepared but unpublished. Threads and Bluesky have only been
            exercised against local mock servers, so treat live behaviour as unverified.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <article className="prose">
            <p>
              A cross-posting call is a distributed write with an unreliable network in the middle. The moment your
              client times out, you no longer know whether the post exists. Retrying blindly duplicates it; not retrying
              loses it. This walkthrough builds a small client that never has to guess: it sends one logical post under a
              stable key, then reads the recorded state back until the post reaches a terminal status.
            </p>

            <h2 id="what-accepted-means">Accepted is not published</h2>
            <p>
              <code>{"POST /v1/posts"}</code> returns <code>{"202"}</code> as soon as the request is validated and stored. The
              response body gives you an identifier and the first recorded status:
            </p>
            <pre><code>{"HTTP/1.1 202 Accepted\n{\n  \"id\": \"post_01J9ZK4W2Q\",\n  \"status\": \"queued\"\n}"}</code></pre>
            <p>
              <code>{"queued"}</code> means the stored post still has work waiting, not that nothing has happened yet. The
              Worker writes one
              publication row per selected platform, then dispatches publication jobs through Cloudflare Queues. If you
              send <code>{"scheduledAt"}</code>, the status is <code>{"scheduled"}</code> instead and the response echoes the
              time. That request is not queued until a Cron scan finds it due.
            </p>

            <h2 id="idempotency-key">Choose an idempotency key you can reproduce</h2>
            <p>
              <code>{"Idempotency-Key"}</code> is optional, but it is the whole reason a retry is safe. The key must identify
              one logical post across every attempt on every machine. Two rules follow from that:
            </p>
            <ul>
              <li>Never generate a new key per attempt. A fresh key on retry asks the API to create a second post.</li>
              <li>Generate the key once, persist it with the payload, and reuse it for every retry of that post. A key derived from a timestamp or random value is fine if it is stored and reused.</li>
              <li>Derive the key from something stable that already identifies the content: a release tag, a job run id, or a hash of the final text.</li>
            </ul>
            <p>A release note keyed by its version stays reproducible months later:</p>
            <pre><code>{"Idempotency-Key: release-0.2.0-rc.1"}</code></pre>
            <p>
              Replaying the same key with the same body returns the original post with <code>{"replayed: true"}</code>. The
              same key with a different body is rejected with HTTP <code>{"409"}</code>, because accepting it would silently
              change what a caller already believes was published. A <code>{"409"}</code> is a bug in your key derivation,
              not a transient error: surface it rather than retrying.
            </p>

            <h2 id="send-the-request">Send the request</h2>
            <p>
              The example below publishes to Threads and Bluesky, with a shorter first line for Bluesky. Every adapter in
              this candidate publishes text only.
            </p>
            <pre><code>{"export SYNDROO_URL=\"https://your-worker.your-subdomain.workers.dev\"\nexport SYNDROO_API_KEY=\"the-same-secret-entered-during-deployment\"\n\ncurl -X POST \"$SYNDROO_URL/v1/posts\" \\\n  -H \"Authorization: Bearer $SYNDROO_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -H \"Idempotency-Key: release-0.2.0-rc.1\" \\\n  --data '{\n    \"content\": \"Syndroo 0.2.0-rc.1 is a release candidate: official Bluesky SDK, strictly timed retries, and a local Mock SNS gate.\",\n    \"platforms\": [\"threads\", \"bluesky\"],\n    \"overrides\": {\n      \"bluesky\": { \"content\": \"0.2.0-rc.1 is up for review: official @atproto/api SDK, timed retries, Mock SNS end-to-end gate.\" }\n    }\n  }'"}</code></pre>
            <p>
              The request body is limited to 64 KiB; larger bodies return <code>{"413"}</code>. A body that is not
              <code>{"application/json"}</code> returns <code>{"415"}</code>. Platform-specific text lives under
              <code>{"overrides"}</code> and is used verbatim for that platform.
            </p>

            <h2 id="poll">Poll the recorded state</h2>
            <p>
              Capture the identifier from the accepted response and read the post back with
              <code>{"GET /v1/posts/{id}"}</code>. Space out the attempts and stop when the status is terminal.
            </p>
            <pre><code>{"export POST_ID=\"post_01J9ZK4W2Q\"\n\ncurl \\\n  -H \"Authorization: Bearer $SYNDROO_API_KEY\" \\\n  \"$SYNDROO_URL/v1/posts/$POST_ID\""}</code></pre>
            <p>
              The response carries the post and one entry per platform publication. This excerpt shows one of the two
              entries the request above produces:
            </p>
            <pre><code>{"{\n  \"id\": \"post_01J9ZK4W2Q\",\n  \"content\": \"Syndroo 0.2.0-rc.1 is a release candidate...\",\n  \"platforms\": [\"threads\", \"bluesky\"],\n  \"status\": \"published\",\n  \"createdAt\": \"2030-01-02T03:04:05.000Z\",\n  \"publications\": [\n    {\n      \"id\": \"pub_...\",\n      \"postId\": \"post_01J9ZK4W2Q\",\n      \"platform\": \"bluesky\",\n      \"provider\": \"bluesky-native\",\n      \"content\": \"0.2.0-rc.1 is up for review...\",\n      \"status\": \"published\",\n      \"attempts\": 1,\n      \"externalId\": \"bafyre...\",\n      \"externalUrl\": \"https://bsky.app/profile/.../post/...\",\n      \"errorAmbiguous\": false,\n      \"createdAt\": \"2030-01-02T03:04:05.000Z\",\n      \"publishedAt\": \"2030-01-02T03:04:06.000Z\"\n    }\n  ]\n}"}</code></pre>
            <p>Post statuses tell you whether to keep waiting:</p>
            <div className="table-scroll" role="region" tabIndex={0} aria-label="Post status reference">
            <table>
              <thead>
                <tr>
                  <th scope="col">Post status</th>
                  <th scope="col">Meaning</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>{"scheduled"}</code></td><td>Waiting for <code>{"scheduledAt"}</code>.</td><td>Wait; Cron scans every 15 minutes.</td></tr>
                <tr><td><code>{"queued"}</code></td><td>Accepted, waiting for a publication job.</td><td>Poll again shortly.</td></tr>
                <tr><td><code>{"publishing"}</code></td><td>At least one platform request is running.</td><td>Poll again shortly.</td></tr>
                <tr><td><code>{"published"}</code></td><td>Every selected platform succeeded.</td><td>Stop. Record the external URLs.</td></tr>
                <tr><td><code>{"partial"}</code></td><td>Some platforms succeeded, some failed.</td><td>Inspect each publication before you retry anything.</td></tr>
                <tr><td><code>{"failed"}</code></td><td>Every selected platform failed.</td><td>Read <code>{"errorCode"}</code> and decide.</td></tr>
              </tbody>
            </table>
            </div>
            <p>
              A polling loop should treat <code>{"published"}</code>, <code>{"partial"}</code> and <code>{"failed"}</code> as
              terminal, and give up after a bounded number of attempts rather than looping forever. If you are scripting
              this, <code>{"GET /v1/posts?limit=50"}</code> lists recent posts, where <code>{"limit"}</code> is an optional
              integer from 1 to 100.
            </p>

            <h2 id="ambiguous">Handle the ambiguous case explicitly</h2>
            <p>
              The genuinely hard failure is the one where the platform may have accepted the post and you cannot tell. A
              transport timeout, an interrupted response, or a post-stage 5xx all leave the same doubt. Syndroo marks
              those publications ambiguous through <code>{"errorAmbiguous"}</code>, and it does not resend them
              automatically.
            </p>
            <p>
              That is a deliberate trade: for retryable failures Syndroo will try again, but for an ambiguous write it
              hands the decision back to you. Your client should do the same. Alerting on <code>{"errorAmbiguous"}</code> and
              letting a human check the platform beats an automated duplicate.
            </p>
            <p>Retryable failures return to <code>{"pending"}</code> with a stored deadline:</p>
            <ul>
              <li>at least 60 seconds after the first failure;</li>
              <li>at least 120 seconds after the second;</li>
              <li>three attempts in total, after which the publication stops.</li>
            </ul>
            <p>
              You do not need to schedule these retries yourself. Sending the original request again with the same
              <code>{"Idempotency-Key"}</code> replays the stored result instead of creating a second post.
            </p>

            <h2 id="scheduling">Prefer scheduling over sleeping</h2>
            <p>
              If the post belongs at a specific future time, pass <code>{"scheduledAt"}</code> as an ISO date-time with an
              explicit timezone, preferably UTC. A future value makes the post <code>{"scheduled"}</code>:
            </p>
            <pre><code>{"{\n  \"content\": \"Nightly ingest finished: 41,208 rows reconciled, 0 quarantined records.\",\n  \"platforms\": [\"threads\", \"bluesky\"],\n  \"scheduledAt\": \"2030-01-02T03:04:05.000Z\"\n}"}</code></pre>
            <p>
              Cron looks for due posts every 15 minutes, and queue and platform time are added on top, so a scheduled
              post is not promised at an exact time. A <code>{"scheduledAt"}</code> in the past is handled as an immediate
              post, which makes backfills behave the way you would expect.
            </p>

            <h2 id="limits">Respect per-platform text limits before you send</h2>
            <p>
              Limit checking is split: some limits are enforced at request time and some surface later as a failed
              publication. Validating locally first is cheaper than a failed write.
            </p>
            <div className="table-scroll" role="region" tabIndex={0} aria-label="Per-platform text limits">
            <table>
              <thead>
                <tr>
                  <th scope="col">Platform</th>
                  <th scope="col">Text limit in this candidate</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Threads</td><td>500 Unicode characters</td><td>Mock-tested locally; live acceptance pending</td></tr>
                <tr><td>Bluesky</td><td>300 Unicode code points and 3,000 UTF-8 bytes enforced by the candidate; HTTP(S) URLs get link facets</td><td>Mock-tested locally; no live-account acceptance record</td></tr>
                <tr><td>X</td><td>280 weighted characters, validated with <code>{"twitter-text"}</code></td><td>Experimental</td></tr>
                <tr><td>Tumblr</td><td>One NPF text block, up to 4,096 Unicode code points</td><td>Experimental</td></tr>
                <tr><td>LinkedIn</td><td>3,000 UTF-16 units after little-text escaping</td><td>Experimental</td></tr>
              </tbody>
            </table>
            </div>
            <p>
              Over-limit content can still be accepted by the API and will finish as a failed publication with
              <code>{"INVALID_CONTENT"}</code> before any network call. Nothing is truncated, so a too-long post never becomes
              a misleadingly shortened one.
            </p>

            <h2 id="requesting-more">Ask for a platform you have not configured</h2>
            <p>
              Naming a platform whose adapter is not installed, or whose credentials are missing, returns HTTP
              <code>{"422"}</code> with the error code <code>{"PLATFORM_NOT_CONFIGURED"}</code> before anything is persisted. That
              check happens before D1 and before the Queue, so a misconfigured deployment cannot half-publish.
            </p>
            <pre><code>{"{\n  \"error\": {\n    \"code\": \"PLATFORM_NOT_CONFIGURED\",\n    \"message\": \"...\"\n  }\n}"}</code></pre>
            <p>
              Other responses worth handling: <code>{"400"}</code> for invalid input, <code>{"401"}</code> for a missing or wrong
              Bearer token, <code>{"404"}</code> for an unknown route or post, and <code>{"503"}</code> when maintenance mode is
              enabled. Maintenance rejects new posts before the body is read, so retrying with the same key and body after
              the window is safe.
            </p>

            <h2 id="what-is-not-covered">What this tutorial does not cover</h2>
            <p>
              Media, threads, replies and resharing are outside this candidate, and so are OAuth login and token issuance.
              You obtain credentials in each platform's own console and store them as Worker secrets. The candidate has no
              published SDK package and no MCP server, so the HTTP API here is the whole interface.
            </p>
            <p>
              The honest caveat: Threads and Bluesky have been exercised against loopback mock servers in the end-to-end
              gate, and X, Tumblr and LinkedIn are covered by unit tests. None of the five has been validated against live
              accounts. Use this pattern, verify your own platforms, and do not treat the states above as proof that a
              given account will accept your post.
            </p>

            <div className="in-page-nav">
              <a href="http://localhost:4174/quickstart/">Quickstart</a>
              <a href="http://localhost:4174/api/">API reference</a>
              <a href="/blog/">Back to the blog</a>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
