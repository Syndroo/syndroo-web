"use client";

import * as React from "react";
import { ui } from "@syndroo/content/site-data";
import type { Locale } from "@syndroo/content/site-data";

export function SiteBehaviors({ locale }: { locale: Locale }): null {
  React.useEffect(() => {
    let cancelled = false;
    void import("../src/js/site").then((module) => {
      if (!cancelled) {
        const messages = ui[locale];
        module.bootWebsite({
          menu: messages.website.menu,
          close: messages.website.close,
          copy: messages.docs.copy,
          copied: messages.docs.copied,
          copyManually: messages.docs.copyManually,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);
  return null;
}
