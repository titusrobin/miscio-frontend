import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://18.209.157.162:8000/api/v1/:path*', // For local development
      },
    ];
  },
};

export default nextConfig;