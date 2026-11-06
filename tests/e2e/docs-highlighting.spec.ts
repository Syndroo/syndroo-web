// Code-block presentation for the docs export: the header version, the footer
// copyright line, and the syntax highlighting `doc.ts` applies at boot.
//
// The highlighting runs in the browser, so this is the only place it can be
// observed: the static HTML deliberately keeps the authored source, and these
// assertions prove the rendered tokens, the untouched copy payload and the two
// theme palettes.
import { expect, test, type Page } from "playwright/test";

import { versions } from "../../packages/content/site-data.ts";

const DOCS = "http://127.0.0.1:4174/";
const VERSION_CHIP = `v${versions.docs}`;
const COPYRIGHT = "\u00a9 2026 Syndroo";

async function visit(page: Page, path: string): Promise<void> {
  await page.route("**/*", (route) => {
    const hostname = new URL(route.request().url()).hostname;
    return ["localhost", "127.0.0.1"].includes(hostname) ? route.continue() : route.abort();
  });
  await page.goto(`${DOCS}${path}`, { waitUntil: "load" });
  await page.waitForSelector('main article pre code[data-highlighted="true"]');
}

test("the header states the documented version and the footer carries only the copyright", async ({ page }) => {
  for (const path of ["reference/cli/", "zh/reference/cli/"]) {
    await page.goto(`${DOCS}${path}`, { waitUntil: "load" });

    await expect(page.locator(".topbar .brand-version")).toHaveText(VERSION_CHIP);
    const warning = page.locator(".docs-development-warning");
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(path.startsWith("zh/") ? "开发阶段" : "active development");

    const footer = page.locator("footer.site-footer .footer-inner > span");
    await expect(footer).toHaveText(COPYRIGHT);

    const footerText = (await page.locator("footer.site-footer").innerText()).replace(/\s+/g, " ");
    expect(footerText, `${path} footer must not restate a version`).not.toContain("0.7");
    expect(footerText, `${path} footer must not restate the license`).not.toContain("Apache");
  }
});

test("json, shell and typescript samples render tokens without changing their text", async ({ page }) => {
  await visit(page, "reference/requests/");

  const json = page.locator('main article pre[data-language="json"]');
  expect(await json.count(), "the request page should highlight its JSON samples").toBeGreaterThanOrEqual(5);

  // The prose-labelled result samples are recognised by their content, not by
  // a label list, so a renamed sample still renders as JSON.
  const result = page.locator('main article pre[data-label="connect result"] code');
  await expect(result.locator(".hljs-attr").first()).toHaveText('"status"');

  await visit(page, "getting-started/agent/");
  const envelope = page.locator('main article pre[data-label="envelope"] code');
  await expect(envelope.locator(".hljs-attr").first()).toHaveText('"protocolVersion"');
  await expect(envelope.locator(".hljs-string").first()).toHaveText('"publish"');
  expect(await envelope.evaluate((node) => (node.textContent ?? "").includes('"operation": "publish"'))).toBe(true);

  await visit(page, "reference/cli/");
  const usage = page.locator('main article pre[data-label="usage"]').first();
  await expect(usage).toHaveAttribute("data-language", "bash");
  // A usage line with no command substitution legitimately has no tokens, so
  // the page is checked for shell tokens rather than one specific block.
  expect(await page.locator('main article pre[data-language="bash"] code span').count()).toBeGreaterThan(0);

  await visit(page, "build/provider-plugins/");
  const typescript = page.locator('main article pre[data-label="index.ts"] code');
  await expect(typescript.locator(".hljs-keyword").first()).toBeVisible();
  expect(await typescript.evaluate((node) => (node.textContent ?? "").includes("defineProvider"))).toBe(true);
});

test("prose samples stay plain and highlighting is idempotent", async ({ page }) => {
  await visit(page, "getting-started/agent/");

  const prompt = page.locator('main article pre[data-label="agent prompt"]');
  await expect(prompt).not.toHaveAttribute("data-language", /.+/);
  await expect(prompt.locator("code")).not.toHaveAttribute("data-highlighted", "true");

  await visit(page, "getting-started/server/");
  const callback = page.locator('main article pre[data-label="callback"] code');
  await expect(callback).not.toHaveAttribute("data-highlighted", "true");

  const before = await page.locator("main article pre code").count();
  await page.evaluate(() => {
    window.dispatchEvent(new Event("resize"));
  });
  expect(await page.locator("main article pre code").count()).toBe(before);
  expect(await page.locator('main article pre code[data-highlighted="true"]').count()).toBeGreaterThan(0);
});

test("the copy button still copies the authored sample after highlighting", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await visit(page, "reference/requests/");

  const block = page.locator('.code-wrap:has(pre[data-label="success"])');
  const source = await block.locator("pre code").textContent();
  expect(source).toContain('"protocolVersion": 1');

  await block.locator(".copy-btn").click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(source);
});

test("both theme palettes colour the same tokens differently", async ({ page }) => {
  await visit(page, "reference/requests/");

  const token = page.locator('main article pre[data-label="success"] code .hljs-attr').first();
  const colorOf = () =>
    token.evaluate((node) => getComputedStyle(node).color as string);

  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });
  const light = await colorOf();

  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  const dark = await colorOf();

  expect(light).toMatch(/^rgb/);
  expect(dark).toMatch(/^rgb/);
  expect(dark, "the dark palette must override the light token colour").not.toBe(light);
});
