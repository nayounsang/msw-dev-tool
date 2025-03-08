import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,jsx,ts,tsx,md,mdx}", "./content/**/*.{md,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgb(255 106 51)",
      },
    },
  },
};

export default config;
