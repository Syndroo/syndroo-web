import type { NextConfig } from "next";

// Static export: the marketing site is served from its own `out/` directory.
// `trailingSlash` keeps the existing directory URLs (`/about/`), and
// `images.unoptimized` removes any dependency on a server-side image endpoint.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ["@syndroo/content", "@syndroo/theme"],
};

export default nextConfig;
