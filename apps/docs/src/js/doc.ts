/*
 * Syndroo docs interactions: search over real local page content, keyboard
 * accessible modal, mobile sidebar drawer, on-page TOC, and copy buttons.
 *
 * Authored in TypeScript. The shared Node 24 build strips types into the
 * same-directory doc.js; this file intentionally avoids TypeScript-only runtime
 * syntax (enums, namespaces, parameter properties) so stripping is exact.
 */
import { docsPages } from "./site-data.js";

type PageDef = {
  fetchPath: string;
  url: string;
  label: string;
};

type SearchEntry = {
  pageLabel: string;
  order: number;
  title: string;
  url: string;
  text: string;
};

type Match = {
  entry: SearchEntry;
  score: number;
  snippet: string;
  titleHit: boolean;
};

// The search corpus is the page registry itself, so a new page is indexed as
// soon as it is registered and cannot fall out of search.
const DOC_PAGES: PageDef[] = docsPages.map(function toPageDef(page): PageDef {
  return { fetchPath: "/" + page.file, url: page.path, label: page.label };
});

const MAX_RESULTS = 12;

let indexPromise: Promise<SearchEntry[]> | null = null;
let searchEntries: SearchEntry[] = [];
let activeResultIndex = -1;
let lastFocused: Element | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/* ------------------------------------------------------------------ */
/* Search index over the actual local pages                            */
/* ------------------------------------------------------------------ */

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function textOf(element: Element | null): string {
  if (!element) {
    return "";
  }
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}

function headingLevel(element: Element): number {
  return Number(element.tagName.replace("H", "")) || 6;
}

function collectSection(heading: Element): string {
  const parts: string[] = [];
  let node: Element | null = heading.nextElementSibling;

  while (node) {
    const tag = node.tagName;
    // Each heading owns the content up to the next heading at any level, so
    // every section is indexed in full exactly once and deep links stay precise.
    if (/^H[1-6]$/.test(tag)) {
      break;
    }
    if (tag === "PRE") {
      parts.push(textOf(node.querySelector("code")) || textOf(node));
    } else if (tag !== "SCRIPT" && tag !== "STYLE") {
      parts.push(textOf(node));
    }
    node = node.nextElementSibling;
  }

  // Full section text is indexed; only the rendered snippet is shortened.
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function extractEntries(article: Element, page: PageDef, orderStart: number): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const headings = Array.from(article.querySelectorAll("h1[id], h2[id], h3[id]"));

  for (let i = 0; i < headings.length; i += 1) {
    const heading = headings[i];
    const id = heading.getAttribute("id");
    if (!id) {
      continue;
    }
    const title = textOf(heading);
    const body = collectSection(heading);
    if (!title && !body) {
      continue;
    }
    entries.push({
      pageLabel: page.label,
      order: orderStart + i,
      title: title || page.label,
      url: page.url + "#" + id,
      text: body,
    });
  }

  return entries;
}

function buildIndex(): Promise<SearchEntry[]> {
  if (indexPromise) {
    return indexPromise;
  }

  indexPromise = (async function load(): Promise<SearchEntry[]> {
    const collected: SearchEntry[] = [];
    let orderBase = 0;

    for (let i = 0; i < DOC_PAGES.length; i += 1) {
      const page = DOC_PAGES[i];
      try {
        const response = await fetch(page.fetchPath, { headers: { Accept: "text/html" } });
        if (!response.ok) {
          continue;
        }
        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, "text/html");
        const article = parsed.querySelector("main article") || parsed.querySelector("article");
        if (!article) {
          continue;
        }
        const entries = extractEntries(article, page, orderBase);
        orderBase += entries.length + 1;
        for (let j = 0; j < entries.length; j += 1) {
          collected.push(entries[j]);
        }
      } catch (error) {
        // A page that cannot be fetched is skipped; remaining pages still index.
      }
    }

    searchEntries = collected;
    return collected;
  })();

  return indexPromise;
}

/* ------------------------------------------------------------------ */
/* Matching and snippets                                               */
/* ------------------------------------------------------------------ */

function tokenize(query: string): string[] {
  return normalize(query).split(" ").filter(function keep(token: string): boolean {
    return token.length > 0;
  });
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) {
    return 0;
  }
  let count = 0;
  let position = haystack.indexOf(needle);
  while (position !== -1 && count < 12) {
    count += 1;
    position = haystack.indexOf(needle, position + needle.length);
  }
  return count;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlight(value: string, tokens: string[]): string {
  let html = escapeHtml(value);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.length < 2) {
      continue;
    }
    const pattern = new RegExp("(" + token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    html = html.replace(pattern, "<mark>$1</mark>");
  }
  return html;
}

function buildSnippet(entry: SearchEntry, tokens: string[]): string {
  const source = entry.text || entry.title;
  const lower = source.toLowerCase();
  let position = -1;

  for (let i = 0; i < tokens.length; i += 1) {
    const found = lower.indexOf(tokens[i]);
    if (found !== -1 && (position === -1 || found < position)) {
      position = found;
    }
  }

  if (position === -1) {
    return source.slice(0, 150).trim();
  }

  const start = Math.max(0, position - 70);
  const end = Math.min(source.length, position + 110);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < source.length ? "..." : "";
  return prefix + source.slice(start, end).trim() + suffix;
}

function findMatches(query: string): Match[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }

  const matches: Match[] = [];

  for (let i = 0; i < searchEntries.length; i += 1) {
    const entry = searchEntries[i];
    const title = entry.title.toLowerCase();
    const body = entry.text.toLowerCase();
    const combined = title + " " + body;

    let allPresent = true;
    let score = 0;
    let titleHit = false;

    for (let j = 0; j < tokens.length; j += 1) {
      const token = tokens[j];
      if (combined.indexOf(token) === -1) {
        allPresent = false;
        break;
      }
      const titleCount = countOccurrences(title, token);
      if (titleCount > 0) {
        titleHit = true;
      }
      score += titleCount * 8;
      score += countOccurrences(body, token);
    }

    if (!allPresent) {
      continue;
    }

    if (entry.title.toLowerCase().indexOf(tokens[0]) !== -1) {
      score += 5;
    }

    matches.push({
      entry: entry,
      score: score,
      snippet: buildSnippet(entry, tokens),
      titleHit: titleHit,
    });
  }

  matches.sort(function sortMatches(a: Match, b: Match): number {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.entry.order - b.entry.order;
  });

  return matches.slice(0, MAX_RESULTS);
}

/* ------------------------------------------------------------------ */
/* Modal rendering                                                     */
/* ------------------------------------------------------------------ */

function renderResults(query: string): void {
  const list = byId<HTMLUListElement>("search-results");
  const meta = byId<HTMLParagraphElement>("search-meta");
  const empty = byId<HTMLDivElement>("search-empty");
  if (!list || !meta || !empty) {
    return;
  }

  list.textContent = "";
  activeResultIndex = -1;

  if (!query.trim()) {
    meta.textContent = "Search every page of the local docs. Try \"idempotency\", \"scheduledAt\" or \"64 KiB\".";
    empty.hidden = true;
    return;
  }

  const matches = findMatches(query);
  const tokens = tokenize(query);

  if (matches.length === 0) {
    meta.textContent = "0 results";
    empty.hidden = false;
    empty.querySelector("strong")!.textContent = "No results for \u201C" + query.trim() + "\u201D";
    return;
  }

  empty.hidden = true;
  meta.textContent = matches.length + (matches.length === 1 ? " result" : " results") + " for \u201C" + query.trim() + "\u201D";

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = match.entry.url;
    link.setAttribute("data-result-index", String(i));

    const titleRow = document.createElement("span");
    titleRow.className = "result-title";
    const titleText = document.createElement("span");
    titleText.innerHTML = highlight(match.entry.title, tokens);
    titleRow.appendChild(titleText);
    const pageLabel = document.createElement("span");
    pageLabel.className = "result-page";
    pageLabel.textContent = match.entry.pageLabel;
    titleRow.appendChild(pageLabel);

    const snippet = document.createElement("span");
    snippet.className = "result-snippet";
    snippet.innerHTML = highlight(match.snippet, tokens);

    link.appendChild(titleRow);
    link.appendChild(snippet);
    item.appendChild(link);
    list.appendChild(item);
  }
}

function setActiveResult(nextIndex: number): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("#search-results a"));
  if (links.length === 0) {
    return;
  }

  activeResultIndex = (nextIndex + links.length) % links.length;

  for (let i = 0; i < links.length; i += 1) {
    links[i].classList.toggle("is-active", i === activeResultIndex);
  }

  links[activeResultIndex].scrollIntoView({ block: "nearest" });
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selector = "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex=\"-1\"])";
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(function visible(element: HTMLElement): boolean {
    return element.offsetParent !== null || element === document.activeElement;
  });
}

function openSearch(): void {
  const modal = byId<HTMLDivElement>("search-modal");
  const input = byId<HTMLInputElement>("search-input");
  if (!modal || !input) {
    return;
  }

  lastFocused = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  input.focus();
  input.select();

  buildIndex().then(function ready(): void {
    if (!modal.hidden && input.value.trim() === "") {
      renderResults(input.value);
    }
  });
}

function closeSearch(restoreFocus: boolean): void {
  const modal = byId<HTMLDivElement>("search-modal");
  const input = byId<HTMLInputElement>("search-input");
  if (!modal || modal.hidden) {
    return;
  }

  modal.hidden = true;
  document.body.style.overflow = "";
  if (input) {
    input.value = "";
  }
  renderResults("");

  if (restoreFocus && lastFocused && lastFocused instanceof HTMLElement) {
    lastFocused.focus();
  }
}

function focusHashTarget(hash: string): void {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const target = document.getElementById(id);
  if (!target) {
    return;
  }
  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "start" });
}

function activateResult(link: HTMLAnchorElement): void {
  const url = new URL(link.href, window.location.href);
  const samePage = url.pathname === window.location.pathname && url.hash !== "";

  closeSearch(false);

  if (samePage) {
    if (window.location.hash !== url.hash) {
      window.location.hash = url.hash;
    }
    window.requestAnimationFrame(function afterHashChange(): void {
      focusHashTarget(url.hash);
    });
  } else {
    window.location.assign(url.href);
  }
}

function wireSearch(): void {
  const modal = byId<HTMLDivElement>("search-modal");
  const input = byId<HTMLInputElement>("search-input");
  if (!modal || !input) {
    return;
  }

  const openers = document.querySelectorAll<HTMLElement>("[data-search-open]");
  for (let i = 0; i < openers.length; i += 1) {
    openers[i].addEventListener("click", openSearch);
  }

  const closeButton = byId<HTMLButtonElement>("search-close");
  if (closeButton) {
    closeButton.addEventListener("click", function onClose(): void {
      closeSearch(true);
    });
  }

  modal.addEventListener("mousedown", function onBackdrop(event: MouseEvent): void {
    if (event.target === modal) {
      closeSearch(true);
    }
  });

  const results = byId<HTMLUListElement>("search-results");
  if (results) {
    results.addEventListener("click", function onResultClick(event: MouseEvent): void {
      const target = event.target as HTMLElement | null;
      const link = target && target.closest ? (target.closest("a") as HTMLAnchorElement | null) : null;
      if (!link || !results.contains(link)) {
        return;
      }
      event.preventDefault();
      activateResult(link);
    });
  }

  input.addEventListener("input", function onInput(): void {
    buildIndex().then(function ready(): void {
      renderResults(input.value);
    });
  });

  input.addEventListener("keydown", function onInputKey(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResult(activeResultIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResult(activeResultIndex - 1);
    } else if (event.key === "Enter") {
      const links = document.querySelectorAll<HTMLAnchorElement>("#search-results a");
      if (activeResultIndex >= 0 && links[activeResultIndex]) {
        event.preventDefault();
        activateResult(links[activeResultIndex]);
      }
    }
  });

  document.addEventListener("keydown", function onDocumentKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    if (!modal.hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch(true);
        return;
      }
      if (event.key === "Tab") {
        const focusable = getFocusable(modal);
        if (focusable.length === 0) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }

    if (typing) {
      return;
    }

    if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
      event.preventDefault();
      openSearch();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Mobile sidebar drawer                                               */
/* ------------------------------------------------------------------ */

function wireSidebar(): void {
  const toggle = byId<HTMLButtonElement>("menu-toggle");
  const sidebar = byId<HTMLElement>("docs-sidebar");
  const scrim = byId<HTMLDivElement>("sidebar-scrim");
  if (!toggle || !sidebar || !scrim) {
    return;
  }

  const mobile = window.matchMedia("(max-width: 900px)");

  function isOpen(): boolean {
    return sidebar.classList.contains("is-open");
  }

  function hideFromAssistiveTech(): void {
    sidebar.setAttribute("inert", "");
    sidebar.setAttribute("aria-hidden", "true");
  }

  function showToAssistiveTech(): void {
    sidebar.removeAttribute("inert");
    sidebar.removeAttribute("aria-hidden");
  }

  function resetChrome(): void {
    sidebar.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    scrim.hidden = true;
    document.body.style.overflow = "";
  }

  // Initial state and any viewport change: a closed mobile drawer must be
  // unreachable by keyboard and hidden from assistive technology, while the
  // desktop sidebar stays a normal in-flow landmark.
  function applyMode(): void {
    resetChrome();
    if (mobile.matches) {
      hideFromAssistiveTech();
    } else {
      showToAssistiveTech();
    }
  }

  function setOpen(open: boolean, moveFocus: boolean): void {
    if (!mobile.matches) {
      return;
    }

    if (open) {
      showToAssistiveTech();
      sidebar.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      scrim.hidden = false;
      document.body.style.overflow = "hidden";
      if (moveFocus) {
        const firstLink = sidebar.querySelector<HTMLAnchorElement>("a[href]");
        if (firstLink) {
          firstLink.focus();
        }
      }
    } else {
      resetChrome();
      hideFromAssistiveTech();
      if (moveFocus) {
        toggle.focus();
      }
    }
  }

  toggle.addEventListener("click", function onToggle(): void {
    setOpen(!isOpen(), true);
  });

  scrim.addEventListener("click", function onScrim(): void {
    setOpen(false, true);
  });

  const links = sidebar.querySelectorAll<HTMLAnchorElement>("a[href]");
  for (let i = 0; i < links.length; i += 1) {
    links[i].addEventListener("click", function onLink(): void {
      if (mobile.matches) {
        setOpen(false, false);
      }
    });
  }

  document.addEventListener("keydown", function onKey(event: KeyboardEvent): void {
    if (!isOpen()) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false, true);
      return;
    }

    if (event.key !== "Tab" || !mobile.matches) {
      return;
    }

    const focusable = getFocusable(sidebar);
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!sidebar.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const media = mobile as MediaQueryList & { addListener?: (callback: () => void) => void };
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", applyMode);
  } else if (typeof media.addListener === "function") {
    media.addListener(applyMode);
  }

  applyMode();
}

/* ------------------------------------------------------------------ */
/* On-page table of contents                                           */
/* ------------------------------------------------------------------ */

function wireToc(): void {
  const toc = byId<HTMLElement>("page-toc");
  if (!toc) {
    return;
  }

  const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>("a[href^=\"#\"]"));
  if (links.length === 0) {
    return;
  }

  const targets: HTMLElement[] = [];
  for (let i = 0; i < links.length; i += 1) {
    const id = decodeURIComponent(links[i].getAttribute("href")!.slice(1));
    const target = document.getElementById(id);
    if (target) {
      targets.push(target);
    }
  }

  if (!("IntersectionObserver" in window) || targets.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    function onIntersect(entries: IntersectionObserverEntry[]): void {
      for (let i = 0; i < entries.length; i += 1) {
        if (!entries[i].isIntersecting) {
          continue;
        }
        const id = entries[i].target.id;
        for (let j = 0; j < links.length; j += 1) {
          const active = decodeURIComponent(links[j].getAttribute("href")!.slice(1)) === id;
          links[j].classList.toggle("is-active", active);
        }
      }
    },
    { rootMargin: "-72px 0px -70% 0px", threshold: 0 },
  );

  for (let i = 0; i < targets.length; i += 1) {
    observer.observe(targets[i]);
  }
}

/* ------------------------------------------------------------------ */
/* Copy buttons                                                        */
/* ------------------------------------------------------------------ */

function copyText(value: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(value);
  }

  return new Promise(function fallback(resolve: () => void, reject: (error: Error) => void): void {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        resolve();
      } else {
        reject(new Error("Copy command was rejected"));
      }
    } catch (error) {
      document.body.removeChild(textarea);
      reject(error instanceof Error ? error : new Error("Copy failed"));
    }
  });
}

function wireCopyButtons(): void {
  const blocks = document.querySelectorAll<HTMLPreElement>("main article pre");

  for (let i = 0; i < blocks.length; i += 1) {
    const pre = blocks[i];
    if (pre.parentElement && pre.parentElement.classList.contains("code-wrap")) {
      continue;
    }

    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode!.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const label = document.createElement("div");
    label.className = "code-label";
    const labelText = document.createElement("span");
    labelText.textContent = pre.getAttribute("data-label") || (pre.closest("[data-code-scope]") ? "Publishing is real when credentials are configured" : "shell");
    label.appendChild(labelText);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-btn";
    button.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"></rect><path d=\"M5 15V5a2 2 0 0 1 2-2h10\"></path></svg><span>Copy</span>";
    button.setAttribute("aria-label", "Copy code sample");

    const status = document.createElement("span");
    status.className = "copy-status";
    status.setAttribute("role", "status");

    button.addEventListener("click", function onClick(): void {
      const code = pre.querySelector("code");
      const value = (code ? code.textContent : pre.textContent) || "";
      copyText(value).then(
        function copied(): void {
          status.textContent = "Copied";
          window.setTimeout(function clear(): void {
            status.textContent = "";
          }, 1600);
        },
        function failed(): void {
          status.textContent = "Select and copy manually";
        },
      );
    });

    label.appendChild(button);
    label.appendChild(status);
    wrap.insertBefore(label, pre);
  }
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

/*
 * The sticky topbar is taller than its 64px row on narrow screens because it
 * wraps to two rows, and taller still while the version-sample banner is
 * visible. Anchor targets and the sticky sidebar/TOC need the real rendered
 * height, so publish it as --topbar-offset. Only the CSS variable changes on
 * resize; nothing scrolls or jumps on its own.
 */
function wireTopbarOffset(): void {
  const topbar = document.querySelector<HTMLElement>(".topbar");
  if (!topbar) {
    return;
  }

  const root = document.documentElement;
  let frame = 0;

  function apply(): void {
    frame = 0;
    const height = topbar.getBoundingClientRect().height;
    if (height > 0) {
      root.style.setProperty("--topbar-offset", height.toFixed(2) + "px");
    }
  }

  function schedule(): void {
    if (frame !== 0) {
      return;
    }
    frame = window.requestAnimationFrame(apply);
  }

  // Synchronous first measurement so the initial hash target is not covered.
  apply();

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(schedule);
    observer.observe(topbar);
  } else {
    window.addEventListener("resize", schedule);
  }
  window.addEventListener("orientationchange", schedule);
}

function boot(): void {
  wireTopbarOffset();
  wireSearch();
  wireSidebar();
  wireToc();
  wireCopyButtons();

  // Warm the index so the first open is instant; failures are handled per page.
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(function idle(): void {
      buildIndex();
    });
  } else {
    window.setTimeout(function later(): void {
      buildIndex();
    }, 400);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
