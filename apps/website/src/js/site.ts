// Client behaviour for the Syndroo marketing prototype.
// Everything here is local-only: the publish demo simulates the documented
// HTTP contract and never sends a network request.

type DemoCase = {
  id: string;
  label: string;
  summary: string;
  postId: string;
  platforms: string[];
  body: string;
  acceptance: string;
  steps: DemoStep[];
};

type PublicationState = "pending" | "publishing" | "published";
type PostState = "queued" | "publishing" | "published";

// Each step carries the state a real GET would report after it, so the rendered
// response is data-driven and never parsed back out of display text.
type DemoStep = {
  title: string;
  detail: string;
  postStatus: PostState;
  publications: Record<string, PublicationState>;
};

const readyStatus = "Ready. Nothing has been sent.";
const idleStatusResponse = "Not queried yet. Run the demo to watch GET /v1/posts/{id} change state.";
const idleAcceptanceResponse = "Not sent yet. Run the demo to see the POST /v1/posts acceptance response.";

function statusExcerpt(current: DemoCase, step: DemoStep): string {
  return JSON.stringify(
    {
      id: current.postId,
      status: step.postStatus,
      publications: current.platforms.map((platform) => ({
        platform,
        status: step.publications[platform] ?? "pending",
      })),
    },
    null,
    2,
  );
}

function pendingFor(platforms: string[], state: PublicationState): Record<string, PublicationState> {
  const publications: Record<string, PublicationState> = {};
  for (const platform of platforms) {
    publications[platform] = state;
  }
  return publications;
}

const demoCases: DemoCase[] = [
  {
    id: "product-update",
    label: "Product update",
    summary: "One release note, two platforms, a platform-specific first line.",
    postId: "post_01J9ZK4W2Q",
    platforms: ["threads", "bluesky"],
    body: `POST /v1/posts
Authorization: Bearer $SYNDROO_API_KEY
Content-Type: application/json
Idempotency-Key: release-0.2.0-rc.1

{
  "content": "Syndroo 0.2.0-rc.1 is a release candidate: official Bluesky SDK, strictly timed retries, and a local Mock SNS gate.",
  "platforms": ["threads", "bluesky"],
  "overrides": {
    "bluesky": { "content": "0.2.0-rc.1 is up for review: official @atproto/api SDK, timed retries, Mock SNS end-to-end gate." }
  }
}`,
    acceptance: `HTTP/1.1 202 Accepted
{
  "id": "post_01J9ZK4W2Q",
  "status": "queued"
}`,
    steps: [
      {
        title: "Request accepted",
        detail: "Bearer token verified, body validated, Idempotency-Key stored. The reply is HTTP 202 with status queued.",
        postStatus: "queued",
        publications: pendingFor(["threads", "bluesky"], "pending"),
      },
      {
        title: "Queued",
        detail: "One pending publication per platform is stored in D1, then dispatched through Cloudflare Queues.",
        postStatus: "queued",
        publications: pendingFor(["threads", "bluesky"], "pending"),
      },
      {
        title: "Publishing",
        detail: "Queue consumers claim the publication jobs and start each platform request.",
        postStatus: "publishing",
        publications: pendingFor(["threads", "bluesky"], "publishing"),
      },
      {
        title: "threads published",
        detail: "Threads confirmed the post. The Bluesky publication is still publishing.",
        postStatus: "publishing",
        publications: { threads: "published", bluesky: "publishing" },
      },
      {
        title: "bluesky published",
        detail: "Both publications are published, so the post status becomes published.",
        postStatus: "published",
        publications: pendingFor(["threads", "bluesky"], "published"),
      },
    ],
  },
  {
    id: "agent-update",
    label: "Agent workflow update",
    summary: "A background job records a finished run on three destinations.",
    postId: "post_01J9ZK9F1B",
    platforms: ["threads", "bluesky", "x"],
    body: `POST /v1/posts
Authorization: Bearer $SYNDROO_API_KEY
Content-Type: application/json
Idempotency-Key: agent-run-2291

{
  "content": "Nightly ingest finished: 41,208 rows reconciled, 0 quarantined records.",
  "platforms": ["threads", "bluesky", "x"]
}`,
    acceptance: `HTTP/1.1 202 Accepted
{
  "id": "post_01J9ZK9F1B",
  "status": "queued"
}`,
    steps: [
      {
        title: "Request accepted",
        detail: "Bearer token verified, body validated, Idempotency-Key stored. The reply is HTTP 202 with status queued.",
        postStatus: "queued",
        publications: pendingFor(["threads", "bluesky", "x"], "pending"),
      },
      {
        title: "Queued",
        detail: "Three pending publications are stored in D1 and dispatched through Cloudflare Queues.",
        postStatus: "queued",
        publications: pendingFor(["threads", "bluesky", "x"], "pending"),
      },
      {
        title: "Publishing",
        detail: "Queue consumers claim the publication jobs and start each platform request.",
        postStatus: "publishing",
        publications: pendingFor(["threads", "bluesky", "x"], "publishing"),
      },
      {
        title: "threads published",
        detail: "Threads confirmed the post. Two publications are still publishing.",
        postStatus: "publishing",
        publications: { threads: "published", bluesky: "publishing", x: "publishing" },
      },
      {
        title: "bluesky published",
        detail: "Bluesky confirmed the post. The X publication is still publishing.",
        postStatus: "publishing",
        publications: { threads: "published", bluesky: "published", x: "publishing" },
      },
      {
        title: "x published",
        detail: "All three publications are published, so the post status becomes published.",
        postStatus: "published",
        publications: pendingFor(["threads", "bluesky", "x"], "published"),
      },
    ],
  },
];

function initNavigation(): void {
  const header = document.querySelector<HTMLElement>(".site-header");
  const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const nav = document.querySelector<HTMLElement>("#site-nav");
  if (!header || !toggle || !nav) {
    return;
  }

  const label = toggle.querySelector<HTMLElement>(".nav-toggle__label");

  const setOpen = (open: boolean): void => {
    header.dataset.menuOpen = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    if (label) {
      label.textContent = open ? "Close" : "Menu";
    }
  };

  setOpen(false);

  toggle.addEventListener("click", () => {
    setOpen(header.dataset.menuOpen !== "true");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.dataset.menuOpen === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) {
      setOpen(false);
    }
  });
}

function initDemo(): void {
  const root = document.querySelector<HTMLElement>("[data-demo]");
  if (!root) {
    return;
  }

  const picker = root.querySelector<HTMLElement>("[data-demo-picker]");
  const requestCode = root.querySelector<HTMLElement>("[data-demo-request]");
  const responseCode = root.querySelector<HTMLElement>("[data-demo-response]");
  const acceptanceCode = root.querySelector<HTMLElement>("[data-demo-acceptance]");
  const responsePanel = root.querySelector<HTMLDetailsElement>("[data-demo-response-panel]");
  const status = root.querySelector<HTMLElement>("[data-demo-status]");
  const stepsList = root.querySelector<HTMLOListElement>("[data-demo-steps]");
  const runButton = root.querySelector<HTMLButtonElement>("[data-demo-run]");
  const resetButton = root.querySelector<HTMLButtonElement>("[data-demo-reset]");
  const copyButton = root.querySelector<HTMLButtonElement>("[data-demo-copy]");
  const copyFeedback = root.querySelector<HTMLElement>("[data-demo-copy-feedback]");
  const caseSummary = root.querySelector<HTMLElement>("[data-demo-summary]");

  if (
    !picker ||
    !requestCode ||
    !responseCode ||
    !acceptanceCode ||
    !status ||
    !stepsList ||
    !runButton ||
    !resetButton ||
    !copyButton ||
    !copyFeedback
  ) {
    return;
  }

  let activeIndex = 0;
  let running = false;
  let timers: number[] = [];

  const pickerButtons = (): HTMLButtonElement[] => [...picker.querySelectorAll<HTMLButtonElement>("button")];

  const render = (index: number): void => {
    const current = demoCases[index];
    activeIndex = index;
    requestCode.textContent = current.body;
    // Both responses are cleared, so no previous case id or state can linger.
    responseCode.textContent = idleStatusResponse;
    responseCode.dataset.state = "placeholder";
    acceptanceCode.textContent = idleAcceptanceResponse;
    acceptanceCode.dataset.state = "placeholder";
    if (caseSummary) {
      caseSummary.textContent = current.summary;
    }
    stepsList.replaceChildren();
    current.steps.forEach((step, stepIndex) => {
      const item = document.createElement("li");
      item.className = "step";
      item.dataset.state = "idle";
      const mark = document.createElement("span");
      mark.className = "step__mark";
      mark.textContent = String(stepIndex + 1);
      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = step.title;
      const detail = document.createElement("small");
      detail.textContent = step.detail;
      text.append(title, detail);
      item.append(mark, text);
      stepsList.append(item);
    });
    status.textContent = readyStatus;
    pickerButtons().forEach((button, buttonIndex) => {
      button.setAttribute("aria-pressed", String(buttonIndex === index));
    });
  };

  const clearTimers = (): void => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
  };

  const setRunning = (value: boolean): void => {
    running = value;
    runButton.disabled = value;
    resetButton.disabled = value;
    pickerButtons().forEach((button) => {
      button.disabled = value;
    });
  };

  const run = (): void => {
    if (running) {
      return;
    }
    clearTimers();
    setRunning(true);
    const current = demoCases[activeIndex];
    const items = [...stepsList.querySelectorAll<HTMLLIElement>(".step")];
    items.forEach((item) => {
      item.dataset.state = "idle";
    });
    responseCode.textContent = "Waiting for the first status response...";
    responseCode.dataset.state = "placeholder";
    acceptanceCode.textContent = "Waiting for the acceptance response...";
    acceptanceCode.dataset.state = "placeholder";
    // Open the response area on run so the state changes are visible.
    if (responsePanel) {
      responsePanel.open = true;
    }
    status.textContent = "Sending the request...";

    current.steps.forEach((step, stepIndex) => {
      const timer = window.setTimeout(() => {
        items.forEach((item, index) => {
          if (index < stepIndex) {
            item.dataset.state = "done";
          } else if (index === stepIndex) {
            item.dataset.state = "active";
          }
        });
        status.textContent = step.title + " - " + step.detail;
        if (stepIndex === 0) {
          // The POST acknowledgement is the real, unchanging 202 receipt.
          acceptanceCode.textContent = current.acceptance;
          acceptanceCode.dataset.state = "data";
        }
        // The GET status response keeps moving until the post is published.
        responseCode.textContent = statusExcerpt(current, step);
        responseCode.dataset.state = "data";
      }, 420 + stepIndex * 780);
      timers.push(timer);
    });

    const done = window.setTimeout(() => {
      items.forEach((item) => {
        item.dataset.state = "done";
      });
      status.textContent = "Simulated run complete. This prototype never contacted a platform.";
      timers = [];
      setRunning(false);
    }, 420 + current.steps.length * 780);
    timers.push(done);
  };

  const reset = (): void => {
    clearTimers();
    setRunning(false);
    render(activeIndex);
  };

  picker.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target ? target.closest("button") : null;
    if (!button || running) {
      return;
    }
    render(Number(button.dataset.index ?? "0"));
  });

  runButton.addEventListener("click", run);
  resetButton.addEventListener("click", reset);

  copyButton.addEventListener("click", () => {
    const text = demoCases[activeIndex].body;
    const report = (message: string): void => {
      copyFeedback.textContent = message;
      window.setTimeout(() => {
        copyFeedback.textContent = "";
      }, 2600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => report("Copied request to the clipboard."),
        () => report("Clipboard blocked. Select the request text and copy manually."),
      );
      return;
    }
    report("Clipboard is unavailable here. Select the request text and copy manually.");
  });

  render(activeIndex);
}

function initYear(): void {
  document.querySelectorAll<HTMLElement>("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

initNavigation();
initDemo();
initYear();
