"use client";

// The sidebar needs the current path to mark `aria-current="page"`, and the
// path is only known on the client, so this thin wrapper supplies it to the
// shared sidebar markup.
import { usePathname } from "next/navigation";
import { DocsSidebar } from "./docs-chrome";

export function DocsSidebarClient(): React.JSX.Element {
  return <DocsSidebar activePath={normalisePath(usePathname())} />;
}

/** Static export serves directory URLs; the registry uses the same shape. */
function normalisePath(pathname: string | null): string {
  if (pathname === null || pathname === "") {
    return "/";
  }
  return pathname.endsWith("/") || pathname.indexOf(".") !== -1 ? pathname : `${pathname}/`;
}
