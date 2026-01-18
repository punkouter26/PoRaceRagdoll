import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Environment variables for API connection
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

export default nextConfig;
