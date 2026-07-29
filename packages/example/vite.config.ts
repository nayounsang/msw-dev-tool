import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@msw-dev-tool/core", "@msw-dev-tool/react"],
  },
  server: {
    watch: {
      // Workspace packages are symlinked under node_modules; watch their dist rebuilds.
      ignored: ["**/node_modules/**", "!**/node_modules/@msw-dev-tool/**"],
    },
  },
});
