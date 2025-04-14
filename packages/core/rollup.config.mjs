import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import { defineConfig } from "rollup";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const externalPackages = [...Object.keys(pkg.peerDependencies || {})];

export default defineConfig([
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/esm/index.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/cjs/index.js",
        format: "cjs",
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        declaration: false,
      }),
      resolve(),
      commonjs(),
    ],
    external: externalPackages,
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/types/index.d.ts",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      dts({
        compilerOptions: {
          skipLibCheck: true,
        },
      }),
    ],
    external: externalPackages,
  },
]);
