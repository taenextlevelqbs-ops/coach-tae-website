import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3150",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    {
      name: "desktop",
      testIgnore: "**/entry-flow.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "tablet",
      testIgnore: "**/entry-flow.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "mobile",
      testIgnore: "**/entry-flow.spec.ts",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "compact",
      testIgnore: "**/entry-flow.spec.ts",
      use: { ...devices["Pixel 7"], viewport: { width: 320, height: 740 } },
    },
    ...[
      { name: "entry-desktop", width: 1280, height: 900 },
      { name: "entry-tablet", width: 768, height: 1024 },
      { name: "entry-mobile", width: 390, height: 844 },
      { name: "entry-compact", width: 320, height: 740 },
    ].map(view => ({ name: view.name, testMatch: "**/entry-flow.spec.ts", use: { ...devices["Desktop Chrome"], viewport: { width: view.width, height: view.height }, baseURL: "http://127.0.0.1:3192" } })),
  ],
  webServer: [{
    command: "node node_modules/next/dist/bin/next start .qb-lab-browser-harness --hostname 127.0.0.1 --port 3150",
    url: "http://127.0.0.1:3150",
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    timeout: 120_000,
    env: { NEXT_TELEMETRY_DISABLED: "1", QB_LAB_ACCOUNTS_STAGE: "disabled" },
  }, {
    command: "npm run start -- --hostname 127.0.0.1 --port 3192",
    url: "http://127.0.0.1:3192/qb-lab/welcome",
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    timeout: 120_000,
    env: { NEXT_TELEMETRY_DISABLED: "1", QB_LAB_ACCOUNTS_STAGE: "disabled" },
  }],
});
