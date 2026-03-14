import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production, NEXT_PUBLIC_BACKEND_URL points to the Render backend service.
    // In local dev, it falls back to http://localhost:8000.
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
