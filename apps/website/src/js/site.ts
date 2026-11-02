// Client behaviour for the Syndroo marketing site.
//
// The only behaviour left is the header menu: the marketing page is static, and
// no code path in this file performs a network request. Authored in TypeScript
// and compiled by the shared Node 24 build with type stripping, so it avoids
// TypeScript-only runtime syntax.

type MenuLabels = { menu: string; close: string };

function initNavigation(labels: MenuLabels): void {
  const header = document.querySelector<HTMLElement>(".site-header");
  const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const menu = document.querySelector<HTMLElement>("#site-menu");
  if (!header || !toggle || !menu) {
    return;
  }

  const label = toggle.querySelector<HTMLElement>(".nav-toggle__label");

  const setOpen = (open: boolean): void => {
    header.dataset.menuOpen = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    if (label) {
      label.textContent = open ? labels.close : labels.menu;
    }
  };

  setOpen(false);

  toggle.addEventListener("click", () => {
    setOpen(header.dataset.menuOpen !== "true");
  });

  menu.addEventListener("click", (event) => {
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

  window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
    if (event.matches) {
      setOpen(false);
    }
  });
}

let booted = false;

/**
 * Wire the header menu.
 *
 * Called once by components/site-behaviors.tsx after hydration. The guard keeps
 * a second call (React's development double-effect) from binding listeners
 * twice.
 */
export function bootWebsite(labels: MenuLabels): void {
  if (booted) {
    return;
  }
  booted = true;
  initNavigation(labels);
}
