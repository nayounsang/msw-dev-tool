import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  // ... Other Nextra config options
});

const nextConfig: NextConfig = withNextra({
  /**
   * This is required for the docs to use msw-dev-tool in production.
   * The build works in a node environment, but msw/browser should be used strictly in a browser environment.
   * However, build checks all browser packages that are statically imported.
   */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias["msw/browser"] = false;
    }
    return config;
  },
});

export default nextConfig;
