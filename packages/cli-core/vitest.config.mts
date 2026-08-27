import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/types.ts"],
      reporter: ["text", "lcov"],
      thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
    },
  },
});
