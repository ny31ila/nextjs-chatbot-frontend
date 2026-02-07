import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If deploying to a subpath (e.g. username.github.io/repo-name),
  // you might need basePath. But for now I'll leave it as root.
};

export default nextConfig;
