import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/shared/testing/**"],
      reporter: ["text", "lcov"],
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
    projects: [
      {
        test: {
          name: "shared-node",
          include: ["src/shared/**/*.test.ts", "src/node/**/*.test.ts", "src/msw/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "browser",
          include: ["src/browser/**/*.test.ts", "src/browser/**/*.test.tsx"],
          environment: "happy-dom",
        },
      },
    ],
  },
});
