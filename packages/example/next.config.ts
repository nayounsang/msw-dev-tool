import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@msw-dev-tool/react"],
  serverExternalPackages: ["@msw-dev-tool/core", "msw"],
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve ?? {};
    const prev = config.resolve.alias;
    const aliases =
      typeof prev === "object" && prev !== null && !Array.isArray(prev) ? { ...prev } : {};

    if (isServer) {
      aliases["msw/browser"] = false;
    } else {
      aliases["msw/node"] = false;
    }

    config.resolve.alias = aliases;
    return config;
  },
};

export default nextConfig;
