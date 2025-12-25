import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for Bun
  experimental: {
    // serverComponentsExternalPackages: ["@libsql/client"],
  },
};

export default nextConfig;
