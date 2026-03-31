import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env"), quiet: true });

if (!process.env.E2E_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_EMAIL) {
  process.env.E2E_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL;
}
if (!process.env.E2E_ADMIN_PASSWORD && process.env.BOOTSTRAP_ADMIN_PASSWORD) {
  process.env.E2E_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD;
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
