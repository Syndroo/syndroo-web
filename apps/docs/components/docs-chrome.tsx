// Shared documentation chrome: topbar, sidebar, footer and search dialog.
//
// The former build injected this markup into every page from apps/docs/src/
// chrome.ts. It is now one layout, so a new MDX page cannot drift out of the
// navigation, and the sidebar is real markup in the exported HTML.
import { ORIGIN_PLACEHOLDERS, docsNav, versions } from "@syndroo/content/site-data";
import { ThemeToggle } from "@syndroo/theme";

export function MenuIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function SearchIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function DocsTopbar(): React.JSX.Element {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="icon-btn"
            id="menu-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="docs-sidebar"
            aria-label="Open documentation navigation"
          >
            <MenuIcon />
          </button>
          <a className="brand" href="/">
            <img src="/assets/logo.svg" alt="" width="26" height="26" />
            <span className="brand-name">Syndroo</span>
            <span className="brand-suffix">docs</span>
          </a>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              type="button"
              data-search-open
              aria-haspopup="dialog"
              aria-controls="search-modal"
              aria-label="Search docs"
            >
              <SearchIcon />
              <span>Search docs</span>
              <kbd>/</kbd>
            </button>
            <span
              className="version-badge"
              title={`The Syndroo CLI candidate these docs describe: ${versions.cli}.`}
            >
              <span className="version-badge__label">Version</span>
              <strong>{versions.docs}</strong>
              <span className="version-badge__stage">{versions.releaseStage}</span>
            </span>
            <ThemeToggle />
            <a className="text-link" href={`${ORIGIN_PLACEHOLDERS.website}/`}>
              Website
            </a>
            <a className="text-link" href="https://github.com/Syndroo/syndroo">
              GitHub
            </a>
          </div>
        </div>
      </header>
    </>
  );
}

/**
 * Sidebar navigation.
 *
 * `activePath` marks the owning entry with `aria-current="page"`; chapter
 * anchors never claim to be the current page. The rendered markup contains
 * every link, so navigation is readable before hydration.
 */
export function DocsSidebar({ activePath }: { activePath: string }): React.JSX.Element {
  return (
    <aside className="sidebar" id="docs-sidebar" aria-label="Documentation navigation">
      {docsNav.map((group) => (
        <div className="sidebar-group" key={group.title}>
          <p className="sidebar-title">{group.title}</p>
          <ul>
            {group.items.map((item) => {
              const current = item.href.indexOf("#") === -1 && item.href === activePath;
              return (
                <li key={`${group.title}-${item.label}`}>
                  <a
                    className={item.sub ? "is-sub" : undefined}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}

export function DocsFooter(): React.JSX.Element {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>
          Syndroo {versions.docs} docs ({versions.releaseStage}). Apache-2.0. Copyright 2026 Syndroo.
        </span>
        <nav aria-label="Footer">
          <a href="/">Quick start</a>
          <a href="/accounts/">Accounts</a>
          <a href="/publishing/">Publishing and retry</a>
          <a href="/agent-setup/">Agent usage</a>
          <a href="/commands/">Commands</a>
          <a href="/faq/">FAQ</a>
          <a href={`${ORIGIN_PLACEHOLDERS.website}/`}>Website</a>
          <a href="https://github.com/Syndroo/syndroo/blob/main/LICENSE">License</a>
        </nav>
      </div>
    </footer>
  );
}

export function DocsSearchDialog(): React.JSX.Element {
  return (
    <div
      className="search-modal"
      id="search-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
      hidden
    >
      <div className="search-panel">
        <div className="search-head">
          <SearchIcon />
          <label className="sr-only" htmlFor="search-input" id="search-title">
            Search documentation
          </label>
          <input id="search-input" type="search" placeholder="Search docs" autoComplete="off" spellCheck={false} />
          <button className="search-close" id="search-close" type="button" aria-label="Close search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6 18 18M18 6 6 18" />
            </svg>
          </button>
        </div>
        <p className="search-meta" id="search-meta">
          Search every page of the local docs. Try &quot;planId&quot;, &quot;retry&quot; or &quot;Bluesky&quot;.
        </p>
        <div className="search-empty" id="search-empty" hidden>
          <strong>No results</strong>
          <span>
            Try a shorter term, or search for a command such as <code>receipts</code>.
          </span>
        </div>
        <ul className="search-results" id="search-results"></ul>
        <div className="search-foot">
          <span>
            <kbd>&uarr;</kbd>
            <kbd>&darr;</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
