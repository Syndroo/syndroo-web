"use client";

// Shared theme implementation for both sites: next-themes owns the
// Light/Dark/System state and its pre-paint script, and the cookie sync here
// carries one choice across the two production origins.
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, Languages, Monitor, Moon, Sun, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** localStorage key shared by both sites. Equal names never cross origins. */
export const THEME_STORAGE_KEY = "syndroo-theme";

/** The cookie only ever holds one of the three theme names. */
export const THEME_COOKIE_NAME = "syndroo-theme";

/** shadcn/ui class helper. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps): React.JSX.Element {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      enableColorScheme={false}
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

/**
 * Pre-paint script for the production cookie.
 *
 * The two sites are different origins, so `localStorage` cannot carry a choice
 * between them. When a `syndroo-theme` cookie exists it is copied into
 * `localStorage` before next-themes' own script runs; that is what lets the
 * production pair share one preference with no first-paint flash. Every
 * storage access is guarded, so a browser with storage disabled still gets a
 * themed page and simply cannot remember the choice.
 */
export const THEME_COOKIE_SCRIPT = `(function(){try{
var name="${THEME_COOKIE_NAME}=";
var found="";
var parts=document.cookie?document.cookie.split("; "):[];
for(var i=0;i<parts.length;i+=1){
  if(parts[i].indexOf(name)===0){found=parts[i].slice(name.length);}
}
if(found==="light"||found==="dark"||found==="system"){
  try{window.localStorage.setItem("${THEME_STORAGE_KEY}",found);}catch(e){}
  document.documentElement.setAttribute("data-theme",found);
}
}catch(e){}})();`;

export function ThemeCookieScript(): React.JSX.Element {
  return <script dangerouslySetInnerHTML={{ __html: THEME_COOKIE_SCRIPT }} />;
}

/**
 * Persist the choice for the production origin pair.
 *
 * Only the theme name is stored, only on `syndroo.com` and its subdomains, and
 * the write is best-effort so a browser that refuses cookies keeps working.
 */
function writeSharedCookie(theme: string): void {
  try {
    const host = window.location.hostname;
    if (host !== "syndroo.com" && !host.endsWith(".syndroo.com")) {
      return;
    }
    document.cookie = `${THEME_COOKIE_NAME}=${theme}; Domain=syndroo.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  } catch {
    // A blocked cookie is not an error the page needs to report.
  }
}

export type ThemeLabels = {
  title: string;
  light: string;
  dark: string;
  system: string;
  choose: string;
  close: string;
};

const DEFAULT_THEME_LABELS: ThemeLabels = {
  title: "Theme",
  light: "Light",
  dark: "Dark",
  system: "System",
  choose: "Choose Light, Dark or System.",
  close: "Close",
};

function useEffectMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function useMobileDrawerLock(open: boolean): void {
  React.useEffect(() => {
    if (!open) {
      return;
    }

    const mobile = window.matchMedia("(max-width: 639px)");
    const previousOverflow = document.body.style.overflow;
    const sync = () => {
      document.body.style.overflow = mobile.matches ? "hidden" : previousOverflow;
    };
    sync();
    mobile.addEventListener("change", sync);
    return () => {
      mobile.removeEventListener("change", sync);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
}

function DrawerLayer({
  closeLabel,
  onClose,
  children,
}: {
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="ui-drawer-layer">
      <button
        className="ui-drawer-backdrop"
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
      />
      {children}
    </div>
  );
}

function DrawerHead({
  title,
  closeLabel,
  onClose,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div className="ui-drawer-head">
      <span>{title}</span>
      <button className="ui-drawer-close" type="button" aria-label={closeLabel} onClick={onClose}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Visible Light/Dark/System control. A menu is used rather than a two-state
 * switch because System is a third state, not the absence of one.
 *
 * The first client render repeats the server render exactly (System, monitor
 * icon). The stored value is adopted in an effect, so hydration never sees a
 * mismatch even though the pre-paint script already painted the right theme.
 */
export function ThemeToggle({
  labels = DEFAULT_THEME_LABELS,
}: {
  labels?: ThemeLabels;
}): React.JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useEffectMounted();
  const current = mounted && theme !== undefined ? theme : "system";
  const options = [
    { value: "light", label: labels.light, Icon: Sun },
    { value: "dark", label: labels.dark, Icon: Moon },
    { value: "system", label: labels.system, Icon: Monitor },
  ] as const;
  const active = options.find((option) => option.value === current) ?? options[2];
  const Icon = active.Icon;
  const [open, setOpen] = React.useState(false);
  useMobileDrawerLock(open);

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger
        className="theme-toggle"
        aria-label={`${labels.title}: ${active.label}. ${labels.choose}`}
        title={mounted ? `${labels.title}: ${active.label}` : labels.title}
      >
        <Icon aria-hidden="true" />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DrawerLayer closeLabel={labels.close} onClose={() => setOpen(false)}>
          <DropdownMenuPrimitive.Content
            className="ui-menu ui-drawer z-50"
            align="end"
            sideOffset={6}
            aria-label={labels.title}
          >
            <DrawerHead title={labels.title} closeLabel={labels.close} onClose={() => setOpen(false)} />
            {options.map((option) => (
              <DropdownMenuPrimitive.CheckboxItem
                key={option.value}
                className="ui-menu__item"
                checked={current === option.value}
                onSelect={() => {
                  setTheme(option.value);
                  writeSharedCookie(option.value);
                }}
                data-resolved={option.value === current ? (resolvedTheme ?? "") : undefined}
              >
                <span className="ui-menu__indicator" aria-hidden="true">
                  <DropdownMenuPrimitive.ItemIndicator>
                    <Check />
                  </DropdownMenuPrimitive.ItemIndicator>
                </span>
                <option.Icon aria-hidden="true" />
                {option.label}
              </DropdownMenuPrimitive.CheckboxItem>
            ))}
          </DropdownMenuPrimitive.Content>
        </DrawerLayer>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

function counterpartPathname(pathname: string, locale: "en" | "zh"): string {
  const normalized = pathname || "/";
  if (locale === "en") {
    return normalized === "/" ? "/zh/" : `/zh${normalized.startsWith("/") ? "" : "/"}${normalized}`;
  }
  const withoutLocale = normalized === "/zh" || normalized === "/zh/"
    ? "/"
    : normalized.replace(/^\/zh(?=\/)/, "");
  return withoutLocale.endsWith("/") || withoutLocale.indexOf(".") !== -1
    ? withoutLocale
    : `${withoutLocale}/`;
}

/**
 * Plain counterpart link. The route is server-rendered; the hash is copied on
 * hydration and before the full navigation so a matching section remains open.
 */
export function LanguageSwitch({
  locale,
  label,
  ariaLabel,
  className,
  explicitHref,
}: {
  locale: "en" | "zh";
  label: string;
  ariaLabel?: string;
  className?: string;
  explicitHref?: string;
}): React.JSX.Element {
  const pathname = usePathname();
  const baseHref = counterpartPathname(pathname, locale);
  const [hash, setHash] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const targetLocale = locale === "en" ? "zh" : "en";
  // Static 404s do not have a real counterpart route. Their layout supplies a
  // public destination instead of deriving one from Next's internal pathname.
  const targetHref = explicitHref ?? `${baseHref}${hash}`;
  const currentHref = `${pathname || "/"}${hash}`;
  const currentLabel = locale === "en" ? "EN" : "中文";
  const choices = [
    { locale: "en", label: "English", href: locale === "en" ? currentHref : targetHref },
    { locale: "zh", label: "简体中文", href: locale === "zh" ? currentHref : targetHref },
  ] as const;
  const triggerLabel = `${label}: ${currentLabel}`;
  useMobileDrawerLock(open);

  React.useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger
        className={cn("language-menu__trigger", className)}
        aria-label={ariaLabel ? `${triggerLabel}. ${ariaLabel}` : triggerLabel}
        title={triggerLabel}
        data-language-switch={targetLocale}
        data-language-href={targetHref}
        data-language-current={locale}
      >
        <Languages aria-hidden="true" />
        <span>{currentLabel}</span>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DrawerLayer closeLabel={locale === "en" ? "Close" : "关闭"} onClose={() => setOpen(false)}>
          <DropdownMenuPrimitive.Content
            className="ui-menu ui-drawer z-50"
            align="end"
            sideOffset={6}
            aria-label={label}
          >
            <DrawerHead
              title={label}
              closeLabel={locale === "en" ? "Close" : "关闭"}
              onClose={() => setOpen(false)}
            />
            {choices.map((choice) => (
              <DropdownMenuPrimitive.Item
                key={choice.locale}
                className="ui-menu__item"
                asChild
                data-current={choice.locale === locale ? "" : undefined}
              >
                <a
                  href={choice.href}
                  hrefLang={choice.locale === "zh" ? "zh-CN" : "en"}
                  lang={choice.locale === "zh" ? "zh-CN" : "en"}
                  aria-current={choice.locale === locale ? "page" : undefined}
                  data-language-switch={choice.locale}
                >
                  <span className="ui-menu__indicator" aria-hidden="true">
                    {choice.locale === locale ? <Check /> : null}
                  </span>
                  {choice.label}
                </a>
              </DropdownMenuPrimitive.Item>
            ))}
          </DropdownMenuPrimitive.Content>
        </DrawerLayer>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
