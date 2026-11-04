import { expect, type Page } from "@playwright/test";

// Accessible-name expectations for Workstream A's UI. Documented in tests/README.md;
// if A's labels differ, adjust here (one place) after agreeing with A.
export const ui = {
  banner: (p: Page) => p.getByText(/SYNTHETIC DEMO DATA/i).first(),
  scenario: (p: Page) => p.getByRole("button", { name: /ceiling tile/i }).first(),
  segment: (p: Page) => p.getByRole("button", { name: /segment|run sam/i }),
  extract: (p: Page) => p.getByRole("button", { name: /extract|muse spark/i }),
  confirm: (p: Page) => p.getByRole("button", { name: /confirm/i }),
  createWo: (p: Page) => p.getByRole("button", { name: /create work order/i }),
  title: (p: Page) => p.getByLabel(/title/i).first(),
  location: (p: Page) => p.getByLabel(/location/i).first(),
  urgency: (p: Page) => p.getByLabel(/urgency/i).first(),
  checklist: (p: Page) => p.getByRole("checkbox"),
  status: (p: Page) => p.getByLabel(/status/i).first(),
  feedback: (p: Page) => p.getByLabel(/feedback/i).first(),
  addFeedback: (p: Page) => p.getByRole("button", { name: /add feedback|submit feedback|send feedback/i }),
  timeline: (p: Page) => p.getByRole("list", { name: /timeline|audit|events/i }),
  error: (p: Page) => p.getByRole("alert"),
};

export const FIXTURE_LABEL = /DEMO[_ ]FIXTURE/i;
export const LIVE_LABEL = /LIVE[_ ]META/i;
export const USER_EDIT_LABEL = /USER[_ ]EDIT/i;

/** Walk the narrated path up to (not including) confirmation. */
export async function reachReview(page: Page) {
  await page.goto("/");
  await expect(ui.banner(page)).toBeVisible();
  await ui.scenario(page).click();
  await ui.segment(page).click();
  await expect(page.getByText(FIXTURE_LABEL).first()).toBeVisible();
  await ui.extract(page).click();
  await expect(ui.title(page)).toBeVisible();
}
