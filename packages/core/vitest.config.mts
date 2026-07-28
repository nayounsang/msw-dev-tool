import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
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
          include: ["src/browser/**/*.test.ts"],
          environment: "happy-dom",
        },
      },
    ],
  },
});
