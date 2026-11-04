// ADR 0002, browser side: key stays in memory, masked, sent only as a header to same-origin API routes,
// cleared by the Clear control and by refresh, and never rendered or stored. Runs against fixture mode;
// requests are observed (not altered) so this checks what the browser sends, not what a provider does.
import { expect, test, type Page, type Request } from "@playwright/test";
import { BYOK_HEADER_LC, E2E_SENTINEL_BYOK as KEY, ui } from "./ui";

function watchApiCalls(page: Page) {
  const calls: Request[] = [];
  page.on("request", (r) => { if (/\/api\/(segment|extract)$/.test(new URL(r.url()).pathname)) calls.push(r); });
  return calls;
}

async function enterKey(page: Page) {
  await ui.byokInput(page).fill(KEY);
  if (await ui.byokUse(page).count()) await ui.byokUse(page).click();
}

async function expectKeyAbsentFromBrowserState(page: Page) {
  expect(page.url()).not.toContain(KEY);
  const state = await page.evaluate(async () => {
    const idb = "databases" in indexedDB ? await indexedDB.databases() : [];
    return JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie, idb });
  });
  expect(state).not.toContain(KEY);
  expect(await page.context().cookies()).toEqual([]); // the app sets no cookies at all
  // Rendered text and attributes: a masked input's value is not part of the serialized DOM attributes.
  expect(await page.locator("body").innerText()).not.toContain(KEY);
  expect(await page.content()).not.toContain(KEY);
}

test("the key input is password-masked", async ({ page }) => {
  await page.goto("/");
  await expect(ui.byokInput(page)).toHaveAttribute("type", "password");
});

test("key is sent only as a header to same-origin API routes, then Clear removes it from later requests", async ({ page }) => {
  const calls = watchApiCalls(page);
  const foreign: string[] = [];
  page.on("request", (r) => { if (new URL(r.url()).origin !== new URL(page.url()).origin && r.url().startsWith("http")) foreign.push(r.url()); });
  await page.goto("/");
  await ui.scenario(page).click();
  await enterKey(page);
  await ui.segment(page).click();
  await expect.poll(() => calls.length).toBe(1);
  expect(await calls[0]!.headerValue(BYOK_HEADER_LC)).toBe(KEY);
  expect(calls[0]!.url()).not.toContain(KEY);
  expect(calls[0]!.postData() ?? "").not.toContain(KEY); // header only, never the body

  await ui.byokClear(page).click();
  await expect(ui.byokInput(page)).toHaveValue("");
  await ui.extract(page).click();
  await expect.poll(() => calls.length).toBe(2);
  expect(await calls[1]!.headerValue(BYOK_HEADER_LC)).toBeNull();

  expect(foreign.filter((u) => !u.includes("127.0.0.1"))).toEqual([]); // never talks to Meta or anyone else directly
  await expectKeyAbsentFromBrowserState(page);
});

test("page refresh clears the key: it is not restored and not sent afterwards", async ({ page }) => {
  const calls = watchApiCalls(page);
  await page.goto("/");
  await ui.scenario(page).click();
  await enterKey(page);
  await expectKeyAbsentFromBrowserState(page);
  await page.reload();
  await expect(ui.byokInput(page)).toHaveValue("");
  await ui.scenario(page).click();
  await ui.segment(page).click();
  await expect.poll(() => calls.length).toBe(1);
  expect(await calls[0]!.headerValue(BYOK_HEADER_LC)).toBeNull();
  await expectKeyAbsentFromBrowserState(page);
});

test("error messages never echo the key", async ({ page }) => {
  await page.route("**/api/segment", (route) =>
    route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ ok: false, error: { code: "UPSTREAM_ERROR", message: "Provider rejected the request." } }) }),
  );
  await page.goto("/");
  await ui.scenario(page).click();
  await enterKey(page);
  await ui.segment(page).click();
  await expect(ui.error(page).first()).toBeVisible();
  expect(await ui.error(page).first().innerText()).not.toContain(KEY);
  await expectKeyAbsentFromBrowserState(page);
});
