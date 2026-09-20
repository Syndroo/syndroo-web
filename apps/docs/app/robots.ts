import type { MetadataRoute } from "next";
import { docsOrigin } from "../lib/origins";

// Static export generates /robots.txt at build time from the configured origin.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${docsOrigin()}/sitemap.xml`,
  };
}
