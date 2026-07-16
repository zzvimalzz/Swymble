import { defineConfig, devices } from "@playwright/test";

// Swymble dev-port family: main 5173, mybirth 5174, what2watch 5175, mymalaysia 5176.
const PORT = 5176;
const baseURL = `http://localhost:${PORT}`;

// In CI the workflow builds first, so e2e runs against the production server.
// Locally it reuses (or starts) the dev server for fast iteration.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
