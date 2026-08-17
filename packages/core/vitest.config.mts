import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
      reporter: ["text", "lcov"],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
    projects: [
      {
        test: {
          name: "shared-node",
          include: ["src/shared/**/*.test.ts", "src/node/**/*.test.ts"],
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
