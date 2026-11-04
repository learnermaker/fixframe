// Live-mode UI states against a MOCK upstream (see playwright.config.ts). Covers: unconfigured, rejected key,
// "LIVE_META only after a successful upstream answer", and retry. These are mocks, not live Meta verification.
import { expect, test } from "@playwright/test";
import { E2E_OK_KEY, FIXTURE_LABEL, LIVE_LABEL, REJECTED_KEY, ui } from "./ui";

test("no deployment key and no session key: extraction shows UNCONFIGURED guidance, never fixture data", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Live mode")).toBeVisible();
  await expect(page.getByText("This deployment has no key. Add your own to run requests.")).toBeVisible();
  await ui.scenario(page).click();
  await ui.extract(page).click();
  const alert = ui.error(page).first();
  await expect(alert).toContainText("No Meta API key is available");
  await expect(alert).toContainText("No demo data was substituted");
  await expect(ui.title(page)).toHaveCount(0);
  await expect(page.getByText(FIXTURE_LABEL)).toHaveCount(0);
  await expect(ui.retry(page)).toBeVisible();
});

test("a rejected session key is reported, is not retried with anything else, and yields no result", async ({ page }) => {
  await page.goto("/");
  await ui.scenario(page).click();
  await ui.byokInput(page).fill(REJECTED_KEY);
  await ui.byokUse(page).click();
  await ui.extract(page).click();
  const alert = ui.error(page).first();
  await expect(alert).toContainText("Meta rejected this API key");
  await expect(alert).toContainText("No other key or demo data was used");
  await expect(alert).not.toContainText(REJECTED_KEY);
  await expect(ui.title(page)).toHaveCount(0);
  await expect(page.getByText(FIXTURE_LABEL)).toHaveCount(0);
  await expect(page.getByText(LIVE_LABEL)).toHaveCount(0);
});

test("a successful (mock) upstream answer is labelled LIVE_META on the review form, and only then", async ({ page }) => {
  await page.goto("/");
  await ui.scenario(page).click();
  await expect(page.getByText(LIVE_LABEL)).toHaveCount(0); // nothing is live before a call
  await ui.byokInput(page).fill(E2E_OK_KEY);
  await ui.byokUse(page).click();
  await ui.extract(page).click();
  await expect(ui.title(page)).toBeVisible();
  await expect(page.getByText(LIVE_LABEL).first()).toBeVisible();
  await expect(page.getByText("muse-spark-1.3").first()).toBeVisible();
  await expect(page.getByText(FIXTURE_LABEL)).toHaveCount(0);
  // Trusted catalog identifiers are shown, not model-chosen ones.
  await expect(ui.location(page)).toHaveValue("Level 2 / North corridor");
});

test("segmentation failure offers Retry and shows no overlay or fixture mask", async ({ page }) => {
  await page.goto("/");
  await ui.scenario(page).click();
  await ui.byokInput(page).fill(E2E_OK_KEY);
  await ui.byokUse(page).click();
  await ui.segment(page).click(); // mock SAM answer is unreadable
  await expect(ui.error(page).first()).toContainText("The response failed validation");
  await expect(ui.retry(page)).toBeVisible();
  await expect(page.getByText(FIXTURE_LABEL)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /overlay/i })).toHaveCount(0);
});
