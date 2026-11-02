import type { MetadataRoute } from "next";
import { websitePages } from "@syndroo/content/site-data";
import { websiteOrigin } from "../lib/origins";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = websiteOrigin().replace(/\/$/, "");
  return websitePages.map((page) => ({
    url: `${origin}${page.path}`,
    alternates: {
      languages: {
        en: `${origin}${page.path.startsWith("/zh/") ? page.path.slice(3) : page.path}`,
        "zh-CN": `${origin}${page.path.startsWith("/zh/") ? page.path : page.path === "/" ? "/zh/" : `/zh${page.path}`}`,
        "x-default": `${origin}${page.path.startsWith("/zh/") ? page.path.slice(3) : page.path}`,
      },
    },
  }));
}
