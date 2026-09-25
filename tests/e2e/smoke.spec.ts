import { expect, test } from "playwright/test";

test("website and docs home pages are reachable", async ({ page }) => {
  await page.goto("http://127.0.0.1:4173/");
  await expect(page).toHaveTitle(/Syndroo/i);

  await page.goto("http://127.0.0.1:4174/");
  await expect(page).toHaveTitle(/Syndroo/i);
});
