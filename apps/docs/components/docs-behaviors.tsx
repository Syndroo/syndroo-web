"use client";

// The authored documentation behaviour (search, drawer, TOC, copy buttons) runs
// after hydration so the exported HTML stays script-free.
import * as React from "react";

export function DocsBehaviors(): null {
  React.useEffect(() => {
    let cancelled = false;
    void import("../src/js/doc").then((module) => {
      if (!cancelled) {
        module.bootDocs();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
