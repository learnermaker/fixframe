// No work order without explicit confirmation (A6 gate), and visible failures with no hidden
// fixture substitution (A9, A10). Failures are injected at the network boundary with page.route:
// this tests the UI's handling of the documented error contract, not any provider.
import { expect, test } from "@playwright/test";
import { FIXTURE_LABEL, reachReview, ui } from "./ui";

test("work order cannot be created before explicit confirmation", async ({ page }) => {
  await reachReview(page);
  const create = ui.createWo(page);
  // Either absent or disabled is acceptable; reachable-and-enabled is not.
  if (await create.count()) await expect(create.first()).toBeDisabled();
  await expect(page.getByText(/WO-DEMO-/)).toHaveCount(0);

  await ui.confirm(page).click();
  await expect(ui.createWo(page)).toBeEnabled();
  await expect(page.getByText(/WO-DEMO-/)).toHaveCount(0); // confirming alone creates nothing
});

const failures = [
  { name: "TIMEOUT", body: { ok: false, error: { code: "TIMEOUT", message: "Provider did not respond in time." } } },
  { name: "UNCONFIGURED", body: { ok: false, error: { code: "UNCONFIGURED", message: "Live provider is not configured." } } },
  { name: "INVALID_RESPONSE", body: { ok: false, error: { code: "INVALID_RESPONSE", message: "Provider response failed validation." } } },
  { name: "malformed (not the documented shape)", body: { ok: true, issue: { id: 7, status: "bogus" } } },
  { name: "malformed (non-JSON)", raw: "<html>gateway error</html>" },
] as const;

for (const f of failures) {
  test(`extract failure: ${f.name} shows an error, creates no issue, and does not substitute fixture data`, async ({ page }) => {
    await page.route("**/api/extract", (route) =>
      "raw" in f
        ? route.fulfill({ status: 502, contentType: "text/html", body: f.raw })
        : route.fulfill({ status: f.body.ok ? 200 : 502, contentType: "application/json", body: JSON.stringify(f.body) }),
    );
    await page.goto("/");
    await ui.scenario(page).click();
    await ui.segment(page).click();
    await expect(page.getByText(FIXTURE_LABEL).first()).toBeVisible(); // segmentation really is fixture
    await ui.extract(page).click();

    await expect(ui.error(page).first()).toBeVisible();
    await expect(ui.title(page)).toHaveCount(0); // no review form => nothing to confirm
    await expect(ui.createWo(page)).toHaveCount(0);
    await expect(page.getByText(/Discoloured ceiling tile observed/)).toHaveCount(0); // fixture issue title must not appear
  });
}
