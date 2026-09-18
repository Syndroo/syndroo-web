// Shared documentation chrome.
//
// The docs build replaces two markers in every page:
//
//   <!-- docs:head -->  topbar, sidebar and the opening layout grid
//   <!-- docs:foot -->  the closing layout grid, footer and search dialog
//
// Everything between the markers stays authored HTML in the page itself, and the
// built page needs no script to show navigation: the sidebar is real markup in
// the served bytes. One module owns the navigation so a new page cannot drift
// out of the sidebar.
import { ORIGIN_PLACEHOLDERS, docsNav, versions } from "../../../packages/content/site-data.ts";

const MENU_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>';
const SEARCH_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path></svg>';

/**
 * Only the unfragmented entry that owns a page is marked as the current page.
 * Chapter anchors such as `/api/#errors` point inside an already-current page
 * and must not all claim `aria-current="page"`.
 */
function isCurrentPage(href: string, activePath: string): boolean {
  return href.indexOf("#") === -1 && href === activePath;
}

/** Escape one interpolated value for an HTML text or attribute context. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSidebar(activePath: string): string {
  const lines = ['    <aside class="sidebar" id="docs-sidebar" aria-label="Documentation navigation">'];

  for (const group of docsNav) {
    lines.push('      <div class="sidebar-group">');
    lines.push(`        <p class="sidebar-title">${escapeHtml(group.title)}</p>`);
    lines.push("        <ul>");
    for (const item of group.items) {
      const current = isCurrentPage(item.href, activePath) ? ' aria-current="page"' : "";
      const className = item.sub ? ' class="is-sub"' : "";
      lines.push(
        `          <li><a${className} href="${escapeHtml(item.href)}"${current}>${escapeHtml(item.label)}</a></li>`,
      );
    }
    lines.push("        </ul>");
    lines.push("      </div>");
  }

  lines.push("    </aside>");
  return lines.join("\n");
}

/**
 * Render the topbar, sidebar and the opening tag of the layout grid.
 * `activePath` is the page's public path, such as `/quickstart/`.
 */
export function renderDocsHead(activePath: string): string {
  return [
    '  <a class="skip-link" href="#main">Skip to content</a>',
    "",
    '  <header class="topbar">',
    '    <div class="topbar-inner">',
    `      <button class="icon-btn" id="menu-toggle" type="button" aria-expanded="false" aria-controls="docs-sidebar" aria-label="Open documentation navigation">`,
    `        ${MENU_ICON}`,
    "      </button>",
    '      <a class="brand" href="/">',
    '        <img src="/assets/logo.svg" alt="" width="26" height="26">',
    '        <span class="brand-name">Syndroo</span>',
    '        <span class="brand-suffix">docs</span>',
    "      </a>",
    '      <div class="topbar-actions">',
    `        <button class="search-trigger" type="button" data-search-open aria-haspopup="dialog" aria-controls="search-modal" aria-label="Search docs">`,
    `          ${SEARCH_ICON}`,
    "          <span>Search docs</span>",
    "          <kbd>/</kbd>",
    "        </button>",
    `        <span class="version-badge" title="Documentation version. There is no historical documentation for this project yet.">`,
    `          <span class="version-badge__label">Version</span>`,
    `          <strong>${escapeHtml(versions.docs)}</strong>`,
    `          <span class="version-badge__stage">${escapeHtml(versions.releaseStage)}</span>`,
    `        </span>`,
    `        <a class="text-link" href="${escapeHtml(ORIGIN_PLACEHOLDERS.website)}/">Website</a>`,
    `        <a class="text-link" href="https://github.com/Syndroo/syndroo">GitHub</a>`,
    "      </div>",
    "    </div>",
    "  </header>",
    "",
    '  <div class="layout">',
    renderSidebar(activePath),
    '    <div class="sidebar-scrim" id="sidebar-scrim" hidden></div>',
    "",
  ].join("\n");
}

/** Close the layout grid, then render the footer and the search dialog. */
export function renderDocsFoot(): string {
  return [
    "  </div>",
    "",
    '  <footer class="site-footer">',
    '    <div class="footer-inner">',
    `      <span>Syndroo ${escapeHtml(versions.docs)} docs (${escapeHtml(versions.releaseStage)}). Apache-2.0. Copyright 2026 Syndroo.</span>`,
    '      <nav aria-label="Footer">',
    '        <a href="/quickstart/">First Bluesky post</a>',
    '        <a href="/agent-setup/">Agent setup</a>',
    '        <a href="/api/">API reference</a>',
    '        <a href="/concepts/">Concepts</a>',
    `        <a href="${escapeHtml(ORIGIN_PLACEHOLDERS.website)}/">Website</a>`,
    '        <a href="https://github.com/Syndroo/syndroo/blob/main/LICENSE">License</a>',
    '        <a href="https://github.com/Syndroo/syndroo/issues">Contact</a>',
    "      </nav>",
    "    </div>",
    "  </footer>",
    "",
    '  <div class="search-modal" id="search-modal" role="dialog" aria-modal="true" aria-labelledby="search-title" hidden>',
    '    <div class="search-panel">',
    '      <div class="search-head">',
    `        ${SEARCH_ICON}`,
    '        <label class="sr-only" for="search-input" id="search-title">Search documentation</label>',
    '        <input id="search-input" type="search" placeholder="Search docs" autocomplete="off" spellcheck="false">',
    '        <button class="search-close" id="search-close" type="button" aria-label="Close search">',
    '          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"></path></svg>',
    "        </button>",
    "      </div>",
    '      <p class="search-meta" id="search-meta">Search every page of the local docs. Try "idempotency", "scheduledAt" or "64 KiB".</p>',
    '      <div class="search-empty" id="search-empty" hidden>',
    "        <strong>No results</strong>",
    '        <span>Try a shorter term, or search for an API field such as <code>overrides</code>.</span>',
    "      </div>",
    '      <ul class="search-results" id="search-results"></ul>',
    '      <div class="search-foot">',
    "        <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>",
    "        <span><kbd>Enter</kbd> open</span>",
    "        <span><kbd>Esc</kbd> close</span>",
    "      </div>",
    "    </div>",
    "  </div>",
    "",
  ].join("\n");
}
