// Core flow on fixture mode: scenario -> segmentation -> extraction -> human correction
// -> work order -> checklist / status / feedback. Acceptance A1-A8, A12-lite.
import { expect, test } from "@playwright/test";
import { FIXTURE_LABEL, LIVE_LABEL, USER_EDIT_LABEL, reachReview, ui } from "./ui";

test("synthetic scenario to tracked work order, with provenance kept distinct", async ({ page }) => {
  await reachReview(page);

  // Fixture output is labelled as such and never as live.
  await expect(page.getByText(FIXTURE_LABEL).first()).toBeVisible();
  await expect(page.getByText(LIVE_LABEL)).toHaveCount(0);

  // Human correction produces a user-edit marker.
  await ui.title(page).fill("Reviewed: discoloured ceiling tile");
  await ui.urgency(page).selectOption("priority_review"); // matches option value or label
  await expect(page.getByText(USER_EDIT_LABEL).first()).toBeVisible();

  // Explicit confirmation, then work order.
  await ui.confirm(page).click();
  await ui.createWo(page).click();
  await expect(page.getByText(/WO-DEMO-/)).toBeVisible();
  await expect(page.getByText(/Reviewed: discoloured ceiling tile/)).toBeVisible();

  // Checklist, status, feedback each update the audit timeline.
  const before = await ui.timeline(page).getByRole("listitem").count();
  await ui.checklist(page).first().check();
  await expect(ui.checklist(page).first()).toBeChecked();
  await ui.status(page).selectOption({ index: 1 });
  await ui.feedback(page).fill("Synthetic reviewer note.");
  await ui.addFeedback(page).click();
  await expect(page.getByText("Synthetic reviewer note.")).toBeVisible();
  expect(await ui.timeline(page).getByRole("listitem").count()).toBeGreaterThanOrEqual(before + 3);

  // Nothing claims live output.
  await expect(page.getByText(LIVE_LABEL)).toHaveCount(0);
});
