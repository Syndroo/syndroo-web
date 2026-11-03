import {
  ORIGIN_PLACEHOLDERS,
  docsNavByLocale,
  ui,
  versions,
} from "@syndroo/content/site-data";
import type { DocsNavItem, Locale } from "@syndroo/content/site-data";
import { LanguageSwitch, ThemeToggle } from "@syndroo/theme";

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

export function DocsTopbar({
  locale,
  languageHref,
}: {
  locale: Locale;
  languageHref?: string;
}): React.JSX.Element {
  const messages = ui[locale];
  const languageLabel = locale === "en" ? "中文" : "English";
  const languageAria = locale === "en" ? messages.docs.viewChinese : messages.docs.viewEnglish;
  return (
    <>
      <a className="skip-link" href="#main">
        {messages.docs.skipToContent}
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href={locale === "en" ? "/" : "/zh/"}>
            <img src="/assets/logo.svg" alt="" width="26" height="26" />
            <span className="brand-name">Syndroo</span>
            <span className="brand-suffix">{messages.docs.suffix}</span>
          </a>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              type="button"
              data-search-open
              aria-haspopup="dialog"
              aria-controls="search-modal"
              aria-label={messages.docs.searchDocs}
            >
              <SearchIcon />
              <span>{messages.docs.searchDocs}</span>
              <kbd>/</kbd>
            </button>
            <LanguageSwitch
              locale={locale}
              label={languageLabel}
              ariaLabel={languageAria}
              className="text-link language-switch language-switch--topbar"
              explicitHref={languageHref}
            />
            <a className="text-link" href={locale === "en" ? `${ORIGIN_PLACEHOLDERS.website}/` : `${ORIGIN_PLACEHOLDERS.website}/zh/`}>
              {messages.docs.website}
            </a>
            <a className="text-link" href="https://github.com/Syndroo/syndroo">
              GitHub
            </a>
            <a className="topbar-cta" href={locale === "en" ? "/" : "/zh/"}>
              {messages.docs.overview}
            </a>
            <ThemeToggle labels={messages.theme} />
            <button
              className="icon-btn"
              id="menu-toggle"
              type="button"
              aria-expanded="false"
              aria-controls="docs-sidebar"
              aria-label={messages.docs.openNavigation}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

function linkIsCurrent(item: DocsNavItem, activePath: string): boolean {
  return item.href.indexOf("#") === -1 && item.href === activePath;
}

export function DocsSidebar({
  locale,
  activePath,
  languageHref,
}: {
  locale: Locale;
  activePath: string;
  languageHref?: string;
}): React.JSX.Element {
  const messages = ui[locale];
  const languageLabel = locale === "en" ? "中文" : "English";
  const languageAria = locale === "en" ? messages.docs.viewChinese : messages.docs.viewEnglish;
  return (
    <aside className="sidebar" id="docs-sidebar" aria-label={messages.docs.navigation}>
      <LanguageSwitch
        locale={locale}
        label={languageLabel}
        ariaLabel={languageAria}
        className="language-switch language-switch--sidebar"
        explicitHref={languageHref}
      />
      {docsNavByLocale[locale].map((group) => (
        <div className="sidebar-group" key={group.title}>
          <p className="sidebar-title">{group.title}</p>
          <ul>
            {group.items.map((item) => {
              const current = linkIsCurrent(item, activePath);
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

export function DocsFooter({ locale }: { locale: Locale }): React.JSX.Element {
  const messages = ui[locale];
  const prefix = locale === "en" ? "" : "/zh";
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>
          {locale === "en"
            ? `Syndroo ${versions.docs} docs (${versions.releaseStage}). Apache-2.0. Copyright 2026 Syndroo.`
            : `Syndroo ${versions.docs} 文档（${versions.releaseStageZh}）。Apache-2.0。2026 Syndroo 版权所有。`}
        </span>
        <nav aria-label={messages.docs.footer}>
          <a href={`${prefix}/`}>{messages.docs.overview}</a>
          <a href={`${prefix}/getting-started/local-cli/`}>{locale === "en" ? "Local CLI" : "本地 CLI"}</a>
          <a href={`${prefix}/platforms/`}>{locale === "en" ? "Platforms" : "平台"}</a>
          <a href={`${prefix}/build/provider-plugins/`}>{locale === "en" ? "Build" : "构建"}</a>
          <a href={`${prefix}/reference/cli/`}>CLI</a>
          <a href={`${prefix}/reference/requests/`}>{locale === "en" ? "Requests" : "请求"}</a>
          <a href={locale === "en" ? `${ORIGIN_PLACEHOLDERS.website}/` : `${ORIGIN_PLACEHOLDERS.website}/zh/`}>
            {messages.docs.website}
          </a>
          <a href="https://github.com/Syndroo/syndroo/blob/main/LICENSE">
            {locale === "en" ? "License" : "许可证"}
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function DocsSearchDialog({ locale }: { locale: Locale }): React.JSX.Element {
  const messages = ui[locale];
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
            {messages.docs.searchDocumentation}
          </label>
          <input
            id="search-input"
            type="search"
            placeholder={messages.docs.searchDocs}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="search-close" id="search-close" type="button" aria-label={messages.docs.close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6 18 18M18 6 6 18" />
            </svg>
          </button>
        </div>
        <p className="search-meta" id="search-meta">
          {messages.docs.searchPrompt}
        </p>
        <div className="search-empty" id="search-empty" hidden>
          <strong>{messages.docs.noResults}</strong>
          <span dangerouslySetInnerHTML={{ __html: messages.docs.noResultsHint }} />
        </div>
        <ul className="search-results" id="search-results"></ul>
        <div className="search-foot">
          <span>
            <kbd>&uarr;</kbd>
            <kbd>&darr;</kbd> {messages.docs.navigate}
          </span>
          <span>
            <kbd>Enter</kbd> {messages.docs.open}
          </span>
          <span>
            <kbd>Esc</kbd> {messages.docs.close}
          </span>
        </div>
      </div>
    </div>
  );
}
