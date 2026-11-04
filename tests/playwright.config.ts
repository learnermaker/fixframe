import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

// `*.e2e.ts` keeps Vitest's default `*.spec.ts` glob from picking these up.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-1280x800", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    // Deliberate fixture mode, no credentials: acceptance case A1. Requires a prior `npm run build` in the repo root.
    command: "npm run start",
    cwd: "..",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    env: { PORT: String(PORT), FIXFRAME_PROVIDER_MODE: "fixture", META_API_TOKEN: "", META_API_BASE_URL: "" },
  },
});
