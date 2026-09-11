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
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
  resolve: {
    alias: {
      "@msw-dev-tool/core/node/internal": path.resolve(__dirname, "../core/src/node/internal.ts"),
      "@msw-dev-tool/core/node": path.resolve(__dirname, "../core/src/node/index.ts"),
    },
  },
});
