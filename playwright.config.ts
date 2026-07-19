import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4321);

if (!Number.isSafeInteger(port) || port < 1024 || port > 65_535) {
  throw new Error("PLAYWRIGHT_PORT must be an integer between 1024 and 65535.");
}

const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  webServer: {
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${port}`,
    port,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
