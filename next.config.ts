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
};

export default nextConfig;
