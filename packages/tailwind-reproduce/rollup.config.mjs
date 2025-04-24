import postcss from "rollup-plugin-postcss";
import tailwind from "@tailwindcss/postcss";

export default {
  input: "index.js",
  output: {
    file: "dist/index.js",
    format: "esm",
  },
  plugins: [
    postcss({
      extract: false,
      inject: false,
      modules: false,
      minimize: true,
      plugins: [tailwind()],
    }),
  ],
};
