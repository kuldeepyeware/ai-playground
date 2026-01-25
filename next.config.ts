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
};

export default nextConfig;
