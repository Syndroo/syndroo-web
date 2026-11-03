import { expect, test } from "playwright/test";

const WEBSITE = "http://127.0.0.1:4173";
const DOCS = "http://127.0.0.1:4174";

test.use({ locale: "zh-CN" });

test("Chinese browser preference never redirects the English default", async ({ page }) => {
  await page.goto(`${WEBSITE}/`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL(/:4173\/$/);

  await page.goto(`${DOCS}/`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL(/:4174\/$/);
});

test("language links select the counterpart page and keep valid anchors", async ({ page }) => {
  await page.goto(`${WEBSITE}/zh/#faq`);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.getByRole("button", { name: /^语言:/ }).first().click();
  await page.getByRole("menuitem", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/:4173\/#faq$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#faq")).toBeVisible();

  await page.goto(`${DOCS}/zh/reference/cli/#global-flags`);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.getByRole("button", { name: /^语言:/ }).first().click();
  const languageMenu = page.getByRole("menu", { name: "语言" });
  await expect(languageMenu.getByRole("menuitem", { name: "简体中文", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await languageMenu.getByRole("menuitem", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/:4174\/reference\/cli\/#global-flags$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#global-flags")).toBeVisible();
});

test("Chinese docs search reads only Chinese pages", async ({ page }) => {
  const fetchedHtml: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "fetch" || request.resourceType() === "document") {
      fetchedHtml.push(new URL(request.url()).pathname);
    }
  });

  await page.goto(`${DOCS}/zh/reference/cli/`);
  await page.getByRole("button", { name: "搜索文档", exact: true }).click();
  await page.getByRole("searchbox", { name: "搜索文档" }).fill("发布");
  await expect(page.locator("#search-results a").first()).toBeVisible();

  const resultHrefs = await page.locator("#search-results a").evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  expect(resultHrefs.length).toBeGreaterThan(0);
  expect(resultHrefs.every((href) => href.startsWith("/zh/"))).toBe(true);
  expect(fetchedHtml.filter((path) => path.endsWith(".html") || path.endsWith("/")).every((path) => path.startsWith("/zh/"))).toBe(true);
});

test("Chinese copy and theme controls expose localized interaction feedback", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: DOCS });
  await page.goto(`${DOCS}/zh/reference/cli/`);

  const toggle = page.locator(".theme-toggle").first();
  await toggle.click();
  await page.getByRole("menuitemcheckbox", { name: "深色", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "复制代码示例" }).first().click();
  await expect(page.locator(".copy-status").first()).toHaveText("已复制");
});

test("both mobile headers expose the language dropdown outside duplicate menus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });

  await page.goto(`${WEBSITE}/zh/`);
  const websiteLanguage = page.getByRole("button", { name: /^语言:/ });
  await expect(websiteLanguage).toBeVisible();
  await websiteLanguage.click();
  await expect(page.getByRole("menu", { name: "语言" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(websiteLanguage).toBeFocused();
  await page.locator(".nav-toggle").click();
  await expect(page.locator("#site-menu").getByRole("link", { name: "用英文查看此页" })).toHaveCount(0);

  await page.goto(`${DOCS}/zh/`);
  const docsLanguage = page.getByRole("button", { name: /^语言:/ });
  await expect(docsLanguage).toBeVisible();
  await docsLanguage.click();
  await expect(page.getByRole("menu", { name: "语言" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(docsLanguage).toBeFocused();
  await page.locator("#menu-toggle").click();
  await expect(page.locator("#docs-sidebar").getByRole("link", { name: "用英文查看此页" })).toHaveCount(0);
});

test("theme dropdown becomes an accessible bottom drawer on both sites", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const site of [WEBSITE, DOCS]) {
    await page.goto(`${site}/`);
    const trigger = page.getByRole("button", { name: /^Theme:/ });
    await trigger.click();

    const menu = page.getByRole("menu", { name: "Theme" });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height, `${site} drawer meets the viewport bottom`).toBeCloseTo(844, 0);
    await expect(page.locator(".ui-drawer-backdrop")).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await menu.getByRole("button", { name: "Close", exact: true }).click();
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

    await trigger.click();
    await expect(page.locator(".ui-drawer-backdrop")).toBeVisible();
    await page.locator(".ui-drawer-backdrop").click({ position: { x: 10, y: 10 } });
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
});

test("mobile popper wrapper owns the viewport and anchors the drawer to its bottom", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto(`${DOCS}/zh/reference/cli/`);

  const trigger = page.getByRole("button", { name: /^语言:/ });
  await trigger.click();

  const wrapper = page.locator("[data-radix-popper-content-wrapper]");
  await expect(wrapper).toHaveCount(1);
  await expect(wrapper).toHaveCSS("position", "fixed");
  await expect(wrapper).toHaveCSS("transform", "none");

  const wrapperBox = (await wrapper.boundingBox())!;
  expect(wrapperBox.x).toBeCloseTo(0, 0);
  expect(wrapperBox.y).toBeCloseTo(0, 0);
  expect(wrapperBox.width).toBeCloseTo(390, 0);
  expect(wrapperBox.height).toBeCloseTo(600, 0);

  const menuBox = (await page.getByRole("menu", { name: "语言" }).boundingBox())!;
  expect(menuBox.x).toBeCloseTo(0, 0);
  expect(menuBox.width).toBeCloseTo(390, 0);
  expect(menuBox.y + menuBox.height).toBeCloseTo(600, 0);
  await expect(page.locator(".ui-drawer-backdrop")).toBeVisible();

  await page.getByRole("menu", { name: "语言" }).getByRole("button", { name: "关闭" }).click();
  await expect(trigger).toBeFocused();
});

test("bilingual install and Agent CTAs lead to localized copyable setup", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: WEBSITE });

  for (const [path, installLabel, agentLabel, copyLabel] of [
    ["/", "Install Syndroo", "Set up with an Agent", "Copied"],
    ["/zh/", "安装 Syndroo", "交给 Agent 设置", "已复制"],
  ] as const) {
    await page.goto(`${WEBSITE}${path}`);
    await page.getByRole("link", { name: installLabel }).first().click();
    await expect(page).toHaveURL(/#install$/);
    await expect(page.locator("#install-command")).toBeVisible();

    await page.locator('[data-copy-target="install-command"]').click();
    await expect(page.locator("#install .copy-status")).toHaveText(copyLabel);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.startsWith("npm install --global @syndroo/cli@0.7.0 ")).toBe(true);
    expect(copied.match(/@syndroo\//g)).toHaveLength(7);

    await page.getByRole("link", { name: agentLabel }).first().click();
    await expect(page).toHaveURL(/#agent$/);
    await expect(page.locator("#agent-prompt")).toBeVisible();
  }
});
