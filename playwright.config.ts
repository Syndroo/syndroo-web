import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
