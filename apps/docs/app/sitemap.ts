import type { MetadataRoute } from "next";
import { docsPages } from "@syndroo/content/site-data";
import { docsOrigin } from "../lib/origins";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = docsOrigin().replace(/\/$/, "");
  return docsPages.map((page) => {
    const englishPath = page.path.startsWith("/zh/") ? page.path.slice(3) : page.path;
    const chinesePath = page.path.startsWith("/zh/")
      ? page.path
      : page.path === "/"
        ? "/zh/"
        : `/zh${page.path}`;
    return {
      url: `${origin}${page.path}`,
      alternates: {
        languages: {
          en: `${origin}${englishPath}`,
          "zh-CN": `${origin}${chinesePath}`,
          "x-default": `${origin}${englishPath}`,
        },
      },
    };
  });
}
