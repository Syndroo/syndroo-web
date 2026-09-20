import type { MetadataRoute } from "next";
import { docsPages } from "@syndroo/content/site-data";
import { docsOrigin } from "../lib/origins";

// One canonical URL per registered page, in registry order.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = docsOrigin().replace(/\/$/, "");
  return docsPages.map((page) => ({ url: `${origin}${page.path}` }));
}
