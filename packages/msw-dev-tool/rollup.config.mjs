import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import pkg from "./package.json" assert { type: "json" };
import postcss from "rollup-plugin-postcss";

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: pkg.main, // dist/cjs/index.js
        format: "cjs",
        sourcemap: true,
      },
      {
        file: pkg.module, // dist/esm/index.js
        format: "esm",
        sourcemap: true,
      },
    ],
    external: [...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      postcss({
        extract: "msw-dev-tool.css",
        minimize: true,
      }),
    ],
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/types/index.d.ts",
      format: "es",
    },
    external: [/\.css$/],
    plugins: [dts()],
  },
];
