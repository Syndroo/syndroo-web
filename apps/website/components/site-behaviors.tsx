"use client";

import * as React from "react";
import { ui } from "@syndroo/content/site-data";
import type { Locale } from "@syndroo/content/site-data";

export function SiteBehaviors({ locale }: { locale: Locale }): null {
  React.useEffect(() => {
    let cancelled = false;
    void import("../src/js/site").then((module) => {
      if (!cancelled) {
        module.bootWebsite({ menu: ui[locale].website.menu, close: ui[locale].website.close });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);
  return null;
}
