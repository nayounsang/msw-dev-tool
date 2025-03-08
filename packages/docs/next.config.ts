import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  // ... Other Nextra config options
});

const nextConfig: NextConfig = withNextra({
  /* config options here */
});

export default nextConfig;
