"use client";

import type { Locale } from "@syndroo/content/site-data";
import { usePathname } from "next/navigation";
import { DocsSidebar } from "./docs-chrome";

export function DocsSidebarClient({
  locale,
}: {
  locale: Locale;
}): React.JSX.Element {
  return (
    <DocsSidebar
      locale={locale}
      activePath={normalisePath(usePathname())}
    />
  );
}

function normalisePath(pathname: string | null): string {
  if (pathname === null || pathname === "") {
    return "/";
  }
  return pathname.endsWith("/") || pathname.indexOf(".") !== -1 ? pathname : `${pathname}/`;
}
