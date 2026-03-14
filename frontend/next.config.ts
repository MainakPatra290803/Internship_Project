import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production, NEXT_PUBLIC_BACKEND_URL points to the Render backend service.
    // In local dev, it falls back to http://localhost:8000.
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    
    // Ensure the URL has a protocol
    if (backendUrl && !backendUrl.startsWith('http') && !backendUrl.startsWith('/')) {
      // Internal Render hostnames (like 'service-name' or 'service-name-1wte') are HTTP only.
      // Public Render URLs contain '.onrender.com' and support HTTPS.
      if (backendUrl.includes('.onrender.com')) {
        backendUrl = `https://${backendUrl}`;
      } else {
        backendUrl = `http://${backendUrl}`;
      }
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
