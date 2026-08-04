import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native module. Bundling it breaks the .node binary lookup.
  serverExternalPackages: ['better-sqlite3'],
  /* config options here */
};

export default nextConfig;
