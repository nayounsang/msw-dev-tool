import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "shared-node",
          include: [
            "src/shared/**/*.test.ts",
            "src/node/**/*.test.ts",
            "src/msw/**/*.test.ts",
          ],
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
