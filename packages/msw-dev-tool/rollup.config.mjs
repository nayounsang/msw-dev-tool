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
        dir: "dist/cjs", // dist/cjs/index.js
        format: "cjs",
        sourcemap: true,
      },
      {
        dir: "dist/esm", // dist/esm/index.js
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
        declaration: false,
      }),
      postcss({
        extract: "msw-dev-tool.css",
        minimize: true,
      }),
    ],
    onwarn(warning, warn) {
      if (
        warning.code === "MODULE_LEVEL_DIRECTIVE" &&
        warning.message.includes("use client")
      ) {
        return;
      }

      /**
       * FIXME: Silence warnings caused by the following issues
       * @see {@link https://github.com/radix-ui/primitives/issues/3281}
       */
      if (
        warning.code === "SOURCEMAP_ERROR" &&
        warning.loc.file.includes("@radix-ui") &&
        warning.loc.line === 1
      ) {
        return;
      }

      warn(warning);
    },
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/types/index.d.ts",
      format: "es",
    },
    external: [/\.css$/, ...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      dts({
        compilerOptions: {
          preserveSymlinks: false,
          skipLibCheck: true,
        },
      }),
    ],
  },
];
