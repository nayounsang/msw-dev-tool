import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";
import tailwind from "@tailwindcss/postcss";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const externalPackages = [
  ...Object.keys(pkg.peerDependencies || {}),
  "msw/browser",
];
export default [
  {
    input: "src/index.ts",
    output: [
      {
        dir: "dist/cjs",
        format: "cjs",
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: "src",
        exports: "named",
      },
      {
        dir: "dist/esm",
        format: "esm",
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    ],
    external: [...externalPackages],
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
        plugins: [tailwind()],
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
    external: [/\.css$/, ...externalPackages],
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
