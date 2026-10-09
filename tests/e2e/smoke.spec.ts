import { expect, test } from "playwright/test";
import { docsPages } from "../../packages/content/site-data.ts";

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`published docs pages and navigation at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.route("**/*", route => {
      const hostname = new URL(route.request().url()).hostname;
      return ["localhost", "127.0.0.1"].includes(hostname) ? route.continue() : route.abort();
    });

    await page.goto("http://127.0.0.1:4173/");
    await expect(page).toHaveTitle(/Syndroo/i);
    await expect(page.locator("main")).toContainText("syndroo publish --input post.json");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("website.png"), fullPage: true });
    await page.locator(".site-footer").getByRole("link", { name: "Docs", exact: true }).click();
    await expect(page).toHaveURL(/:4174\/$/);

    for (const entry of docsPages) {
      if (viewport.width < 800) {
        await page.getByRole("button", { name: "Open documentation navigation" }).click();
        await expect(page.locator("#menu-toggle")).toHaveAttribute("aria-expanded", "true");
      }
      await page.locator("#docs-sidebar").getByRole("link", { name: entry.label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`:4174${entry.path}$`));
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("#docs-sidebar a[aria-current=page]")).toHaveText(entry.label);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator("main")).not.toContainText(/--plan|planId|frozen plan/);
      if (entry.path === "/reference/cli/" || entry.path === "/getting-started/local-cli/") {
        await expect(page.locator("main")).toContainText("--data");
        await page.screenshot({ path: testInfo.outputPath(`${entry.label}.png`), fullPage: true });
      }
    }

    await page.getByRole("button", { name: "Search docs", exact: true }).click();
    await page.getByRole("searchbox", { name: "Search documentation" }).fill("--data");
    await expect(page.locator("#search-results a").first()).toBeVisible();
    await page.locator("#search-results a").first().click();
    await expect(page.locator("#search-modal")).toBeHidden();
    await expect(page.locator("main")).toContainText("--data");
    expect(pageErrors).toEqual([]);
  });
}
