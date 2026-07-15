import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Two test projects:
// - "unit": fast jsdom tests colocated with source (src/**/*.test.ts[x]).
// - "storybook": renders every story in headless Chromium and runs its play
//   functions + a11y checks (@storybook/addon-vitest).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["./src/test/setup.ts"],
          globals: true,
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
        // aria-query (CJS, nested under @testing-library/dom) must be
        // pre-bundled or its named exports break in the browser runner.
        optimizeDeps: {
          include: ["@testing-library/dom", "aria-query"],
        },
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
