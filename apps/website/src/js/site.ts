// Client behaviour for the Syndroo marketing site.
//
// Everything here is local: the demo renders fixtures from the shared content
// module, and no code path in this file performs a network request. Drafting,
// preview and confirmation belong to the visitor's own agent or script; the
// simulated steps only show the documented states.
//
// Authored in TypeScript and compiled by the shared Node 24 build with type
// stripping, so it avoids TypeScript-only runtime syntax.
import { platforms } from "@syndroo/content/site-data";
import { demoScenarios } from "@syndroo/content/demo-data";
import type { DemoResponse, DemoScenario, DemoStep, PublicationEntry } from "@syndroo/content/demo-data";

type PlatformInfo = {
  name: string;
  icon: string;
};

const platformInfo = new Map<string, PlatformInfo>();
for (const platform of platforms) {
  platformInfo.set(platform.id, { name: platform.name, icon: platform.icon });
}

const READY_STATUS = "Ready. Nothing has been sent.";
const IDLE_STATUS_RESPONSE =
  "Not queried yet. Send the request to watch GET /v1/posts/{id} change state.";
const STEP_DELAY_MS = 900;

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function platformName(key: string): string {
  const info = platformInfo.get(key);
  return info ? info.name : key;
}

function platformIcon(key: string): string {
  const info = platformInfo.get(key);
  return info ? info.icon : key;
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Simulated publish demo                                              */
/* ------------------------------------------------------------------ */

/** The status response a real GET would return for this step. */
function statusExcerpt(scenario: DemoScenario, step: DemoStep | null): string {
  if (!step || step.postStatus === null) {
    return IDLE_STATUS_RESPONSE;
  }

  const publications = step.publications.map((entry) => {
    const row: Record<string, unknown> = { platform: entry.platform, status: entry.status };
    if (entry.externalId !== undefined) {
      row.externalId = entry.externalId;
    }
    if (entry.externalUrl !== undefined) {
      row.externalUrl = entry.externalUrl;
    }
    if (entry.errorCode !== undefined) {
      row.errorCode = entry.errorCode;
    }
    if (entry.errorMessage !== undefined) {
      row.errorMessage = entry.errorMessage;
    }
    if (entry.errorAmbiguous !== undefined) {
      row.errorAmbiguous = entry.errorAmbiguous;
    }
    return row;
  });

  return JSON.stringify(
    { id: scenario.postId, status: step.postStatus, publications },
    null,
    2,
  );
}

/** Compose the request text a client would actually send. */
function requestText(scenario: DemoScenario, step: DemoStep | null): string {
  const body = step && step.request ? step.request.body : scenario.request.body;
  return [
    `POST ${scenario.request.path}`,
    "Authorization: Bearer $SYNDROO_API_KEY",
    "Content-Type: application/json",
    `Idempotency-Key: ${scenario.request.idempotencyKey}`,
    "",
    body,
  ].join("\n");
}

type ResultState = "idle" | "pending" | "publishing" | "published" | "failed";

type ResultRow = {
  platform: string;
  state: ResultState;
  stateLabel: string;
  detail: string;
  externalId?: string;
  externalUrl?: string;
  externalUrlIsExample?: boolean;
};

function resultRows(scenario: DemoScenario, step: DemoStep | null): ResultRow[] {
  const byPlatform = new Map<string, PublicationEntry>();
  for (const entry of step ? step.publications : []) {
    byPlatform.set(entry.platform, entry);
  }

  return scenario.platforms.map((key) => {
    const entry = byPlatform.get(key);
    if (!entry) {
      return {
        platform: key,
        state: "idle" as ResultState,
        stateLabel: "Not started",
        detail: "Waiting for an accepted post.",
      };
    }

    if (entry.status === "pending") {
      return {
        platform: key,
        state: "pending" as ResultState,
        stateLabel: "Queued",
        detail: "Publication stored and waiting for a Queue consumer.",
      };
    }

    if (entry.status === "publishing") {
      return {
        platform: key,
        state: "publishing" as ResultState,
        stateLabel: "Publishing",
        detail: "The platform call is in flight.",
      };
    }

    if (entry.status === "published") {
      const parts: string[] = [];
      if (entry.externalId !== undefined) {
        parts.push(`id ${entry.externalId}`);
      }
      if (entry.note !== undefined) {
        parts.push(entry.note);
      }
      return {
        platform: key,
        state: "published" as ResultState,
        stateLabel: "Published",
        detail: parts.join(" \u00b7 "),
        externalId: entry.externalId,
        externalUrl: entry.externalUrl,
        externalUrlIsExample: entry.externalUrlIsExample,
      };
    }

    const failureParts: string[] = [];
    if (entry.errorCode !== undefined) {
      failureParts.push(entry.errorCode);
    }
    if (entry.errorAmbiguous === true) {
      failureParts.push("needs a person");
    }
    if (entry.note !== undefined) {
      failureParts.push(entry.note);
    }
    return {
      platform: key,
      state: "failed" as ResultState,
      stateLabel: entry.errorAmbiguous === true ? "Failed, ambiguous" : "Failed",
      detail: failureParts.join(" \u00b7 "),
    };
  });
}

function initDemo(): void {
  const root = document.querySelector<HTMLElement>("[data-demo]");
  if (!root) {
    return;
  }

  const picker = root.querySelector<HTMLElement>("[data-demo-picker]");
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-demo-view]")];
  const agentPanel = root.querySelector<HTMLElement>("[data-demo-panel=\"agent\"]");
  const apiPanel = root.querySelector<HTMLElement>("[data-demo-panel=\"api\"]");
  const conversation = root.querySelector<HTMLOListElement>("[data-demo-conversation]");
  const boundary = root.querySelector<HTMLElement>("[data-demo-boundary]");
  const requestCode = root.querySelector<HTMLElement>("[data-demo-request]");
  const responseCode = root.querySelector<HTMLElement>("[data-demo-response]");
  const responseLabel = root.querySelector<HTMLElement>("[data-demo-response-label]");
  const statusBody = root.querySelector<HTMLElement>("[data-demo-status-body]");
  const pathTag = root.querySelector<HTMLElement>("[data-demo-path]");
  const keyTag = root.querySelector<HTMLElement>("[data-demo-key]");
  const summary = root.querySelector<HTMLElement>("[data-demo-summary]");
  const resultsList = root.querySelector<HTMLUListElement>("[data-demo-results]");
  const statusLine = root.querySelector<HTMLElement>("[data-demo-status]");
  const cautionLine = root.querySelector<HTMLElement>("[data-demo-caution]");
  const runButton = root.querySelector<HTMLButtonElement>("[data-demo-run]");
  const pauseButton = root.querySelector<HTMLButtonElement>("[data-demo-pause]");
  const replayButton = root.querySelector<HTMLButtonElement>("[data-demo-replay]");
  const resetButton = root.querySelector<HTMLButtonElement>("[data-demo-reset]");
  const copyButton = root.querySelector<HTMLButtonElement>("[data-demo-copy]");
  const copyFeedback = root.querySelector<HTMLElement>("[data-demo-copy-feedback]");

  if (
    !picker ||
    viewButtons.length === 0 ||
    !agentPanel ||
    !apiPanel ||
    !conversation ||
    !boundary ||
    !requestCode ||
    !responseCode ||
    !responseLabel ||
    !statusBody ||
    !summary ||
    !resultsList ||
    !statusLine ||
    !runButton ||
    !pauseButton ||
    !replayButton ||
    !resetButton ||
    !copyButton ||
    !copyFeedback
  ) {
    return;
  }

  const reducedMotion = prefersReducedMotion();
  let activeIndex = 0;
  let activeView: "agent" | "api" = "agent";
  let stepIndex = -1;
  let playing = false;
  let paused = false;
  let timer: number | null = null;

  const scenario = (): DemoScenario => demoScenarios[activeIndex];
  const lastStepIndex = (): number => scenario().steps.length - 1;
  const step = (): DemoStep | null => {
    const current = scenario();
    return stepIndex >= 0 && stepIndex < current.steps.length ? current.steps[stepIndex] : null;
  };

  /**
   * The most recent HTTP response shown to the visitor, from the steps already
   * played. The 202 receipt stays visible while the status response advances,
   * and a later 200 replay or 409 conflict replaces it.
   */
  const latestResponse = (): DemoResponse | null => {
    const current = scenario();
    for (let index = Math.min(stepIndex, current.steps.length - 1); index >= 0; index -= 1) {
      const candidate = current.steps[index].response;
      if (candidate.kind !== "none") {
        return candidate;
      }
    }
    return null;
  };

  const clearTimer = (): void => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const renderViews = (): void => {
    for (const button of viewButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.demoView === activeView));
    }
    agentPanel.hidden = activeView !== "agent";
    apiPanel.hidden = activeView !== "api";
  };

  const setInactive = (button: HTMLButtonElement, inactive: boolean): void => {
    // `aria-disabled` instead of `disabled`: disabling the focused button would
    // move focus away from the control a visitor just used.
    button.setAttribute("aria-disabled", String(inactive));
    button.classList.toggle("is-inactive", inactive);
  };

  // Built once. Re-creating the buttons on every state change would drop focus
  // from the scenario a visitor just picked.
  const pickerButtons: HTMLButtonElement[] = [];
  const buildPicker = (): void => {
    picker.replaceChildren();
    demoScenarios.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "picker__option";
      button.dataset.index = String(index);
      button.setAttribute("aria-pressed", String(index === activeIndex));
      button.textContent = item.label;
      picker.append(button);
      pickerButtons.push(button);
    });
  };

  const renderPicker = (): void => {
    pickerButtons.forEach((button, index) => {
      button.setAttribute("aria-pressed", String(index === activeIndex));
      setInactive(button, playing);
    });
  };

  const renderConversation = (): void => {
    const current = scenario();
    conversation.replaceChildren();
    const turns = current.steps
      .slice(0, stepIndex + 1)
      .map((item) => item.turn)
      .filter((turn): turn is NonNullable<DemoStep["turn"]> => turn !== undefined);

    if (turns.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.className = "turn turn--idle";
      placeholder.textContent = "The conversation appears here as the scenario runs.";
      conversation.append(placeholder);
      return;
    }

    for (const turn of turns) {
      const item = document.createElement("li");
      item.className = turn.speaker === "you" ? "turn turn--you" : "turn turn--agent";
      const who = document.createElement("span");
      who.className = "turn__who";
      who.textContent = turn.speaker === "you" ? "You" : "Agent";
      const text = document.createElement("span");
      text.className = "turn__text";
      text.textContent = turn.text;
      item.append(who, text);

      if (turn.previews && turn.previews.length > 0) {
        const list = document.createElement("ul");
        list.className = "previews";
        for (const preview of turn.previews) {
          const row = document.createElement("li");
          row.className = "preview";
          const label = document.createElement("span");
          label.className = "preview__platform";
          label.append(iconSpan(preview.platform));
          const name = document.createElement("span");
          name.textContent = platformName(preview.platform);
          label.append(name);
          const body = document.createElement("span");
          body.className = "preview__text";
          body.textContent = preview.text;
          row.append(label, body);
          list.append(row);
        }
        item.append(list);
      }

      conversation.append(item);
    }
  };

  function iconSpan(platform: string): HTMLSpanElement {
    const icon = document.createElement("span");
    icon.className = `platform-icon platform-icon--sm platform-icon--${platformIcon(platform)}`;
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  const renderResults = (): void => {
    resultsList.replaceChildren();
    for (const row of resultRows(scenario(), step())) {
      const item = document.createElement("li");
      item.className = "result";
      item.dataset.state = row.state;

      const icon = iconSpan(row.platform);
      const name = document.createElement("span");
      name.className = "result__name";
      name.textContent = platformName(row.platform);

      const state = document.createElement("span");
      state.className = "result__state";
      const mark = document.createElement("span");
      mark.className = "result__mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = stateGlyph(row.state);
      const stateText = document.createElement("span");
      stateText.textContent = row.stateLabel;
      state.append(mark, stateText);

      const detail = document.createElement("span");
      detail.className = "result__detail";
      detail.textContent = row.detail;
      if (row.externalUrl !== undefined) {
        detail.append(document.createTextNode(" "));
        const link = document.createElement("a");
        link.href = row.externalUrl;
        link.rel = "noreferrer";
        link.textContent = row.externalUrlIsExample ? "example result link" : "result link";
        detail.append(link);
      }

      item.append(icon, name, state, detail);
      resultsList.append(item);
    }
  };

  function stateGlyph(state: ResultState): string {
    if (state === "published") {
      return "\u2713";
    }
    if (state === "failed") {
      return "\u00d7";
    }
    if (state === "publishing") {
      return "\u21bb";
    }
    if (state === "pending") {
      return "\u2022";
    }
    return "\u2013";
  }

  const renderApiPanel = (): void => {
    const current = scenario();
    const currentStep = step();
    requestCode.textContent = requestText(current, currentStep);
    if (pathTag) {
      pathTag.textContent = current.request.path;
    }
    if (keyTag) {
      keyTag.textContent = `Idempotency-Key: ${current.request.idempotencyKey}`;
    }

    const response = latestResponse();
    if (response) {
      responseLabel.textContent = response.label;
      responseCode.textContent = response.body;
      responseCode.dataset.state = response.kind === "conflict" ? "conflict" : "data";
    } else {
      responseLabel.textContent = "No response yet";
      responseCode.textContent =
        "The POST receipt appears here after the request is sent. Nothing is sent from this page.";
      responseCode.dataset.state = "placeholder";
    }

    statusBody.textContent = statusExcerpt(current, currentStep);
  };

  const renderAppearance = (): void => {
    const current = scenario();
    summary.textContent = current.summary;
    boundary.textContent = current.boundary;
    if (cautionLine) {
      cautionLine.textContent = current.caution;
    }
    renderConversation();
    renderApiPanel();
    renderResults();
  };

  const setPlaying = (value: boolean): void => {
    playing = value;
    setInactive(runButton, value);
    setInactive(replayButton, value);
    setInactive(pauseButton, !value || reducedMotion);
    // Reset stays available so a visitor can abort a run or a paused run.
    setInactive(resetButton, false);
    if (!value) {
      paused = false;
      pauseButton.setAttribute("aria-pressed", "false");
      pauseButton.textContent = "Pause";
    }
    renderPicker();
  };

  const applyStep = (): void => {
    const currentStep = step();
    renderAppearance();
    if (currentStep) {
      statusLine.textContent = `${currentStep.title} - ${currentStep.detail}`;
    }
  };

  /** Move to a step, clamped so the final step stays the current one. */
  const goToStep = (index: number): void => {
    stepIndex = Math.max(-1, Math.min(index, lastStepIndex()));
    applyStep();
  };

  const finish = (): void => {
    clearTimer();
    setPlaying(false);
    const current = scenario();
    statusLine.textContent = `${current.outcome.headline}. ${current.outcome.detail} Simulated run complete: no platform was contacted.`;
  };

  const scheduleNext = (): void => {
    clearTimer();
    if (paused) {
      return;
    }
    if (reducedMotion) {
      goToStep(lastStepIndex());
      finish();
      return;
    }
    timer = window.setTimeout(() => {
      timer = null;
      if (stepIndex >= lastStepIndex()) {
        finish();
        return;
      }
      goToStep(stepIndex + 1);
      scheduleNext();
    }, STEP_DELAY_MS);
  };

  const renderIdle = (replaceStatus: boolean): void => {
    clearTimer();
    stepIndex = -1;
    renderAppearance();
    if (replaceStatus) {
      statusLine.textContent = READY_STATUS;
    }
  };

  const start = (): void => {
    if (playing) {
      return;
    }
    clearTimer();
    goToStep(-1);
    paused = false;
    pauseButton.setAttribute("aria-pressed", "false");
    pauseButton.textContent = "Pause";
    setPlaying(true);
    statusLine.textContent =
      "Starting the simulated client workflow. Nothing has been sent from this page.";
    scheduleNext();
  };

  const togglePause = (): void => {
    if (!playing) {
      return;
    }
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Resume" : "Pause";
    if (paused) {
      clearTimer();
      statusLine.textContent = "Paused. Resume to continue the simulated run.";
    } else {
      statusLine.textContent = "Resuming the simulated run.";
      scheduleNext();
    }
  };

  const reset = (): void => {
    setPlaying(false);
    renderIdle(true);
    renderPicker();
  };

  picker.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target ? target.closest("button") : null;
    if (!button || playing) {
      return;
    }
    const index = Number(button.dataset.index ?? "0");
    if (!Number.isInteger(index) || index === activeIndex) {
      return;
    }
    activeIndex = index;
    renderPicker();
    renderIdle(true);
  });

  for (const button of viewButtons) {
    button.addEventListener("click", () => {
      const view = button.dataset.demoView;
      if (view !== "agent" && view !== "api") {
        return;
      }
      activeView = view;
      renderViews();
    });
  }

  runButton.addEventListener("click", start);
  pauseButton.addEventListener("click", togglePause);
  replayButton.addEventListener("click", start);
  resetButton.addEventListener("click", reset);

  copyButton.addEventListener("click", () => {
    const text = requestText(scenario(), step());
    const report = (message: string): void => {
      copyFeedback.textContent = message;
      window.setTimeout(() => {
        copyFeedback.textContent = "";
      }, 2600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => report("Copied the request to the clipboard."),
        () => report("Clipboard blocked. Select the request text and copy manually."),
      );
      return;
    }
    report("Clipboard is unavailable here. Select the request text and copy manually.");
  });

  renderViews();
  buildPicker();
  // One explicit initial state for every control, so no control claims to be
  // unavailable while its action would still run (or the reverse).
  setPlaying(false);
  renderPicker();
  renderIdle(false);
  statusLine.textContent = READY_STATUS;
}

let booted = false;

/**
 * Wire the header menu and the hero demo.
 *
 * Called once by components/site-behaviors.tsx after hydration. The guard keeps
 * a second call (React's development double-effect) from binding listeners
 * twice, and the page is otherwise unchanged from the authored script.
 */
export function bootWebsite(): void {
  if (booted) {
    return;
  }
  booted = true;
  initNavigation();
  initDemo();
}
