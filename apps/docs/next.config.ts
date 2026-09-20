import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// Static export of an App Router site whose pages are MDX. `trailingSlash`
// keeps the existing directory URLs, and MDX pages are real routes rather than
// a client-side renderer, so refresh works without any server route.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  transpilePackages: ["@syndroo/content", "@syndroo/theme"],
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: ["remark-gfm"] },
});

export default withMDX(nextConfig);
