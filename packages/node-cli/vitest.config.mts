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
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
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
