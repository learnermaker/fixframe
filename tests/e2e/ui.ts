import { expect, type Page } from "@playwright/test";

// Accessible names taken from Workstream A's real components (src/components/*), checked 2026-11-04.
// All selector knowledge lives here; if a label changes, fix it here, do not loosen the tests.
export const ui = {
  scenario: (p: Page) => p.getByRole("button", { name: /Ceiling tile discolouration/ }),
  segment: (p: Page) => p.getByRole("button", { name: "Run segmentation" }),
  extract: (p: Page) => p.getByRole("button", { name: "Extract issue" }),
  confirm: (p: Page) => p.getByRole("button", { name: "Confirm issue" }),
  createWo: (p: Page) => p.getByRole("button", { name: "Create work order" }),
  title: (p: Page) => p.getByLabel("Title", { exact: true }),
  location: (p: Page) => p.getByLabel("Location", { exact: true }),
  urgency: (p: Page) => p.getByLabel("Urgency", { exact: true }),
  checklist: (p: Page) => p.getByRole("checkbox"),
  status: (p: Page) => p.getByLabel("Status", { exact: true }),
  feedback: (p: Page) => p.getByLabel("Feedback", { exact: true }),
  addFeedback: (p: Page) => p.getByRole("button", { name: "Add feedback" }),
  timeline: (p: Page) => p.getByRole("list", { name: "Audit timeline" }),
  // Next.js injects an empty role="alert" route announcer; only non-empty alerts count as app errors.
  error: (p: Page) => p.getByRole("alert").filter({ hasText: /\S/ }),
  retry: (p: Page) => p.getByRole("button", { name: "Retry" }),
  // ADR 0002 panel (live mode only): password input, "Use for this session", "Clear key".
  byokInput: (p: Page) => p.getByLabel("Meta API key", { exact: true }),
  byokUse: (p: Page) => p.getByRole("button", { name: "Use for this session" }),
  byokClear: (p: Page) => p.getByRole("button", { name: "Clear key" }),
};

// Header carrying a user-entered key to same-origin API routes (ADR 0002).
export const BYOK_HEADER_LC = "x-fixframe-meta-key";
export const E2E_SENTINEL_BYOK = "FF_SENTINEL_BYOK_do-not-leak-4d81e2";
export const E2E_OK_KEY = "FF_SENTINEL_BYOK_accepted-5be319";
// The live-mode mock upstream answers this key with 401. Keep in sync with playwright.config.ts.
export const REJECTED_KEY = "FF_SENTINEL_BYOK_rejected-91ac07";

export const FIXTURE_LABEL = /DEMO_FIXTURE/;
export const LIVE_LABEL = /LIVE_META/;
export const USER_EDIT_LABEL = /USER_EDIT/;

/** Walk the narrated path up to (not including) confirmation. */
export async function reachReview(page: Page) {
  await page.goto("/");
  await ui.scenario(page).click();
  await ui.segment(page).click();
  await expect(page.getByText(FIXTURE_LABEL).first()).toBeVisible();
  await ui.extract(page).click();
  await expect(ui.title(page)).toBeVisible();
}
