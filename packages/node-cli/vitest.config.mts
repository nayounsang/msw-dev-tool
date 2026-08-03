import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@msw-dev-tool/core/node/internal": path.resolve(
        __dirname,
        "../core/src/node/internal.ts"
      ),
      "@msw-dev-tool/core/node": path.resolve(
        __dirname,
        "../core/src/node/index.ts"
      ),
    },
  },
});
