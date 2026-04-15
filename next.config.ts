import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only export for Capacitor (mobile app), never for Vercel/Web
  output: process.env.IS_CAPACITOR_BUILD === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // Warning: * with credentials might fail on some strict browers, but we'll use a custom header anyway
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-culko-session" },
        ],
      },
    ];
  },
};

export default nextConfig;
