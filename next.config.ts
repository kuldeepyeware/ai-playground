import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow all HTTPS domains
      {
        protocol: "https",
        hostname: "**",
      },
      // Allow all HTTP domains
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // Optimize for production
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  // Optimize React
  reactStrictMode: true,
};

export default nextConfig;
