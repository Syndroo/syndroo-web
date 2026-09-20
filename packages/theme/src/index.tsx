"use client";

// Shared theme implementation for both sites: next-themes owns the
// Light/Dark/System state and its pre-paint script, and the cookie sync here
// carries one choice across the two production origins.
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, Monitor, Moon, Sun } from "lucide-react";
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

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

function useEffectMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/**
 * Visible Light/Dark/System control. A menu is used rather than a two-state
 * switch because System is a third state, not the absence of one.
 *
 * The first client render repeats the server render exactly (System, monitor
 * icon). The stored value is adopted in an effect, so hydration never sees a
 * mismatch even though the pre-paint script already painted the right theme.
 */
export function ThemeToggle(): React.JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useEffectMounted();
  const current = mounted && theme !== undefined ? theme : "system";
  const active = OPTIONS.find((option) => option.value === current) ?? OPTIONS[2];
  const Icon = active.Icon;

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger
        className="theme-toggle"
        aria-label={`Theme: ${active.label}. Choose Light, Dark or System.`}
        title={mounted ? `Theme: ${active.label}` : "Theme"}
      >
        <Icon aria-hidden="true" />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content className="ui-menu z-50" align="end" sideOffset={6}>
          {OPTIONS.map((option) => (
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
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
