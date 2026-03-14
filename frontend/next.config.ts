import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production, NEXT_PUBLIC_BACKEND_URL points to the Render backend service.
    // In local dev, it falls back to http://localhost:8000.
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    
    // Ensure the URL has a protocol (Render blueprint 'host' property returns just the hostname)
    if (backendUrl && !backendUrl.startsWith('http') && !backendUrl.startsWith('/')) {
      backendUrl = `https://${backendUrl}`;
    }

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
