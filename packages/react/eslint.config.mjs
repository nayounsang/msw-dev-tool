import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig({
  files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  plugins: {
    js,
    "@typescript-eslint": tseslint.plugin,
    "react": pluginReact
  },
  languageOptions: {
    globals: globals.browser,
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true
      }
    }
  },
  settings: {
    react: {
      version: "18.0.0"
    }
  },
  rules: {
    ...js.configs.recommended.rules,
    ...tseslint.configs.recommended.rules,
    ...pluginReact.configs.recommended.rules,
    //"no-restricted-imports": ["error", { paths: ["@radix-ui/themes"] }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error"]
  }
});