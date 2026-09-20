import type { MetadataRoute } from "next";
import { websitePages } from "@syndroo/content/site-data";
import { websiteOrigin } from "../lib/origins";

// One canonical URL per registered page, in registry order.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = websiteOrigin().replace(/\/$/, "");
  return websitePages.map((page) => ({ url: `${origin}${page.path}` }));
}
