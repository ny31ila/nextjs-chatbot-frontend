/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // basePath and assetPrefix will be managed by the GitHub Actions workflow
  // for automatic deployment to GitHub Pages.
};

export default nextConfig;
