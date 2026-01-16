import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // This proxies '/api/...' to your Vercel backend URL
        source: '/api/:path*',
        destination: 'https://mystarlinkstats-backend.vercel.app/:path*', 
      },
    ]
  },
};

export default nextConfig;
