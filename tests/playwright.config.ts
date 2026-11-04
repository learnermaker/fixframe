import { defineConfig, devices } from "@playwright/test";

const FIXTURE_PORT = Number(process.env.E2E_PORT ?? 3100);
const LIVE_PORT = FIXTURE_PORT + 1;
const FAKE_PORT = FIXTURE_PORT + 99;

// A key the mock upstream rejects with 401. Keep in sync with REJECTED_KEY in e2e/ui.ts.
const REJECTED_KEY = "FF_SENTINEL_BYOK_rejected-91ac07";

const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } };

// `*.e2e.ts` keeps Vitest's default `*.spec.ts` glob from picking these up.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    // Explicit fixture mode, no credentials (acceptance A1).
    { name: "desktop-1280x800", testIgnore: /(byok|live-ui)\.e2e/, use: { ...desktop, baseURL: `http://127.0.0.1:${FIXTURE_PORT}` } },
    // Narrow mobile width: Chromium with a phone-sized viewport (not a real mobile browser).
    { name: "mobile-375x812", testIgnore: /(byok|live-ui)\.e2e/, use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, hasTouch: true, baseURL: `http://127.0.0.1:${FIXTURE_PORT}` } },
    // Live mode against a MOCK upstream (no deployment key): BYOK handling and live-mode UI states. Not live Meta verification.
    { name: "live-mock-desktop", testMatch: /(byok|live-ui)\.e2e/, use: { ...desktop, baseURL: `http://127.0.0.1:${LIVE_PORT}` } },
  ],
  // Requires a prior `npm run build` in the repo root; every server runs the production build.
  webServer: [
    {
      command: "npm run start",
      cwd: "..",
      url: `http://127.0.0.1:${FIXTURE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      env: { PORT: String(FIXTURE_PORT), FIXFRAME_PROVIDER_MODE: "fixture", META_API_TOKEN: "", META_API_BASE_URL: "" },
    },
    {
      command: "node tests/support/fake-meta-cli.ts",
      cwd: "..",
      url: `http://127.0.0.1:${FAKE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { FAKE_META_PORT: String(FAKE_PORT), FAKE_META_MODE: "muse-valid", FAKE_META_REJECT_KEY: REJECTED_KEY },
    },
    {
      command: "npm run start",
      cwd: "..",
      url: `http://127.0.0.1:${LIVE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      env: { PORT: String(LIVE_PORT), FIXFRAME_PROVIDER_MODE: "live", META_API_TOKEN: "", META_API_BASE_URL: `http://127.0.0.1:${FAKE_PORT}` },
    },
  ],
});
