import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Tenemos un package-lock en el home del usuario que confunde al detector de workspace.
  outputFileTracingRoot: path.join(__dirname),
};

export default config;
