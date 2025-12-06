/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Temporarily disable development tools
  experimental: {
    devIndicators: {
      buildActivity: false,
    },
  },
};

export default nextConfig;
