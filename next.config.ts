import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // allow dev server to build resources fetched from network interface
  // @ts-ignore
  allowedDevOrigins: ['26.211.8.37'],
};

export default nextConfig;
