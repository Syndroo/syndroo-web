import type { MetadataRoute } from "next";
import { websiteOrigin } from "../lib/origins";

// Static export generates /robots.txt at build time from the configured origin,
// so a custom-origin build can never point crawlers at the loopback default.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${websiteOrigin()}/sitemap.xml`,
  };
}
