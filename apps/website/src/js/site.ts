// Client behaviour for the Syndroo marketing site.
//
// Behaviour for the header menu and copy buttons. No code path performs a
// network request. Authored in TypeScript and compiled by the shared Node 24
// build with type stripping, so it avoids TypeScript-only runtime syntax.

type SiteLabels = {
  menu: string;
  close: string;
  copy: string;
  copied: string;
  copyManually: string;
};

function initNavigation(labels: SiteLabels): void {
  const header = document.querySelector<HTMLElement>(".site-header");
  const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const menu = document.querySelector<HTMLElement>("#site-menu");
  const backdrop = document.querySelector<HTMLButtonElement>("#site-menu-backdrop");
  const closeButton = menu?.querySelector<HTMLButtonElement>(".site-menu__close");
  if (!header || !toggle || !menu || !backdrop || !closeButton) {
    return;
  }

  const label = toggle.querySelector<HTMLElement>(".nav-toggle__label");
  const mobile = window.matchMedia("(max-width: 639px)");
  const wide = window.matchMedia("(min-width: 1024px)");
  let previousOverflow = "";
  let ownsScrollLock = false;

  const acquireScrollLock = (): void => {
    if (!ownsScrollLock) {
      previousOverflow = document.body.style.overflow;
      ownsScrollLock = true;
    }
    document.body.style.overflow = "hidden";
  };

  const releaseScrollLock = (): void => {
    if (!ownsScrollLock) {
      return;
    }
    document.body.style.overflow = previousOverflow;
    previousOverflow = "";
    ownsScrollLock = false;
  };

  const setOpen = (open: boolean, moveFocus = true): void => {
    header.dataset.menuOpen = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    backdrop.hidden = !open || !mobile.matches;
    if (label) {
      label.textContent = open ? labels.close : labels.menu;
    }
    if (open && mobile.matches) {
      menu.setAttribute("role", "dialog");
      menu.setAttribute("aria-modal", "true");
      acquireScrollLock();
      if (moveFocus) {
        menu.querySelector<HTMLAnchorElement>("a[href]")?.focus();
      }
    } else {
      menu.removeAttribute("role");
      menu.removeAttribute("aria-modal");
      releaseScrollLock();
      if (!open && moveFocus && mobile.matches) {
        toggle.focus();
      }
    }
  };

  setOpen(false, false);

  toggle.addEventListener("click", () => {
    setOpen(header.dataset.menuOpen !== "true");
  });

  closeButton.addEventListener("click", () => {
    setOpen(false);
  });

  backdrop.addEventListener("click", () => {
    setOpen(false);
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setOpen(false, false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.dataset.menuOpen === "true") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key !== "Tab" || header.dataset.menuOpen !== "true" || !mobile.matches) {
      return;
    }

    const focusable = [
      closeButton,
      ...menu.querySelectorAll<HTMLAnchorElement>("a[href]"),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!menu.contains(document.activeElement)) {
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

  wide.addEventListener("change", (event) => {
    if (event.matches) {
      setOpen(false, false);
    }
  });

  mobile.addEventListener("change", () => {
    if (header.dataset.menuOpen === "true") {
      setOpen(false, false);
    }
  });
}

function copyText(value: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(value);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const copied = document.execCommand("copy");
      textarea.remove();
      if (copied) {
        resolve();
      } else {
        reject(new Error("Copy command was rejected"));
      }
    } catch (error) {
      textarea.remove();
      reject(error instanceof Error ? error : new Error("Copy failed"));
    }
  });
}

function initCopyButtons(labels: SiteLabels): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy-target]")) {
    button.addEventListener("click", () => {
      const targetId = button.dataset.copyTarget;
      const target = targetId ? document.getElementById(targetId) : null;
      const code = target?.querySelector("code")?.textContent ?? target?.textContent ?? "";
      const status = button.closest(".copy-block")?.querySelector<HTMLElement>(".copy-status");
      const buttonLabel = button.querySelector<HTMLElement>(".copy-btn__label");

      copyText(code).then(
        () => {
          if (status) status.textContent = labels.copied;
          if (buttonLabel) buttonLabel.textContent = labels.copied;
          window.setTimeout(() => {
            if (status) status.textContent = "";
            if (buttonLabel) buttonLabel.textContent = labels.copy;
          }, 1600);
        },
        () => {
          if (status) status.textContent = labels.copyManually;
        },
      );
    });
  }
}

let booted = false;

/**
 * Wire the header menu and copy buttons.
 *
 * Called once by components/site-behaviors.tsx after hydration. The guard keeps
 * a second call (React's development double-effect) from binding listeners
 * twice.
 */
export function bootWebsite(labels: SiteLabels): void {
  if (booted) {
    return;
  }
  booted = true;
  initNavigation(labels);
  initCopyButtons(labels);
}
