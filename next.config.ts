import type { NextConfig } from "next";

process.env.FORCE_NODE_FETCH = "true";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;