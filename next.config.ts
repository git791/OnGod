import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* PWA-lite settings for mobile-first demo */
  reactStrictMode: true,
  // Allow images from external sources if needed later
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: '/api/markets/:path*',
        destination: 'https://internal-server.bento.fun/:path*',
      },
      {
        source: '/api/tournaments/:path*',
        destination: 'https://bento-fun-tournaments-backend-3nku.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;
