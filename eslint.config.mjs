// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import prettier from "eslint-config-prettier/flat";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".open-next/**",
    ".wrangler/**",
    "storybook-static/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
  ...storybook.configs["flat/recommended"],
  // Must stay last: disables stylistic rules that would fight Prettier.
  prettier,
]);

export default eslintConfig;
