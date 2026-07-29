import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  // ... Other Nextra config options
});

const nextConfig: NextConfig = withNextra({
  transpilePackages: ["@msw-dev-tool/core", "@msw-dev-tool/react"],
  /**
   * This is required for the docs to use @msw-dev-tool/core in production.
   * The build works in a node environment, but msw/browser should be used strictly in a browser environment.
   * However, build checks all browser packages that are statically imported.
   */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias["msw/browser"] = false;
    }

    // Watch workspace package rebuilds under node_modules/@msw-dev-tool/*
    config.snapshot = {
      ...config.snapshot,
      managedPaths: [/^(.+?[\\/]node_modules[\\/])(?!@msw-dev-tool)/],
    };

    return config;
  },
});

export default nextConfig;
