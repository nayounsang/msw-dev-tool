import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import { defineConfig } from "rollup";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const externalPackages = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
  "msw/browser",
  "msw/node",
  "node:fs",
  "node:os",
  "node:path",
];

const entries = [
  { input: "src/browser/index.ts", file: "browser/index" },
  { input: "src/shared/index.ts", file: "shared/index" },
  { input: "src/node/index.ts", file: "node/index" },
  { input: "src/node/internal.ts", file: "node/internal" },
  { input: "src/msw/index.ts", file: "msw/index" },
];

const jsConfigs = entries.map(({ input, file }) => ({
  input,
  output: [
    {
      file: `dist/esm/${file}.js`,
      format: "esm",
      sourcemap: true,
    },
    {
      file: `dist/cjs/${file}.js`,
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
}));

const dtsConfigs = entries.map(({ input, file }) => ({
  input,
  output: {
    file: `dist/types/${file}.d.ts`,
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
}));

const isWatch = !!process.env.ROLLUP_WATCH;

export default defineConfig(isWatch ? jsConfigs : [...jsConfigs, ...dtsConfigs]);
