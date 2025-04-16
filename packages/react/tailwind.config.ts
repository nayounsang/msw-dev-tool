import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./src/style/**/*.css"],
  theme: {
    extend: {},
  },
};

export default config;
