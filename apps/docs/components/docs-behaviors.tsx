"use client";

import * as React from "react";
import type { Locale } from "@syndroo/content/site-data";

export function DocsBehaviors({ locale }: { locale: Locale }): null {
  React.useEffect(() => {
    let cancelled = false;
    void import("../src/js/doc").then((module) => {
      if (!cancelled) {
        module.bootDocs(locale);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);
  return null;
}
