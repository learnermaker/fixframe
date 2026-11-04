// Acceptance A12 (partial) and the desktop/narrow-mobile requirement. Runs in both Playwright projects.
import { expect, test } from "@playwright/test";
import { FIXTURE_LABEL, ui } from "./ui";

test("synthetic banner visible and no horizontal page scroll at this width", async ({ page }) => {
  await page.goto("/");
  await expect(ui.banner(page)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("narrated path up to review is operable from the keyboard alone", async ({ page }) => {
  await page.goto("/");
  for (const control of [ui.scenario, ui.segment, ui.extract]) {
    const el = control(page);
    await el.focus();
    await expect(el).toBeFocused();
    await page.keyboard.press("Enter");
    if (control === ui.segment) await expect(page.getByText(FIXTURE_LABEL).first()).toBeVisible();
  }
  await expect(ui.title(page)).toBeVisible();
  // Focus is visibly indicated on interactive controls (not removed by `outline: none` without a replacement).
  await ui.confirm(page).focus();
  const indicator = await ui.confirm(page).evaluate((el) => {
    const s = getComputedStyle(el);
    return s.outlineStyle !== "none" || s.boxShadow !== "none";
  });
  expect(indicator, "focused control has no outline or box-shadow").toBe(true);
});

test("errors are announced via role=alert", async ({ page }) => {
  await page.route("**/api/segment", (route) =>
    route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ ok: false, error: { code: "TIMEOUT", message: "Provider did not respond in time." } }) }),
  );
  await page.goto("/");
  await ui.scenario(page).click();
  await ui.segment(page).click();
  await expect(ui.error(page).first()).toContainText(/respond|time/i);
});
