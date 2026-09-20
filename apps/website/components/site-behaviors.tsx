"use client";

// The authored browser behaviour is still one module; this component only runs
// it after hydration so the static HTML stays script-free.
import * as React from "react";

export function SiteBehaviors(): null {
  React.useEffect(() => {
    let cancelled = false;
    void import("../src/js/site").then((module) => {
      if (!cancelled) {
        module.bootWebsite();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
