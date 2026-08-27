import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "lcov"],
      thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
    },
  },
  resolve: {
    alias: {
      "@msw-dev-tool/core/node/internal": path.resolve(__dirname, "../core/src/node/internal.ts"),
      "@msw-dev-tool/core/node": path.resolve(__dirname, "../core/src/node/index.ts"),
    },
  },
});
