import { expect, test, type Page } from "playwright/test";

const WEBSITE = "http://127.0.0.1:4173/";
const DOCS = "http://127.0.0.1:4174/";

const SHELL_MAX = 1280;
const SHELL_GUTTERS = [
  { min: 1100, gutter: 48 },
  { min: 720, gutter: 32 },
  { min: 0, gutter: 20 },
] as const;
const LOGO = 26;
const WORDMARK_WIDE = 17;
const WORDMARK_NARROW = 16;
const WORDMARK_BREAKPOINT = 720;
const BODY_WIDE = 17;
const BODY_NARROW = 16;
const PRIMARY = "rgb(100, 70, 237)";
const PRIMARY_HOVER = "rgb(83, 52, 216)";
const WHITE = "rgb(255, 255, 255)";

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 900 },
  { width: 1024, height: 900 },
  { width: 768, height: 900 },
  { width: 720, height: 900 },
  { width: 375, height: 812 },
] as const;

function shell(width: number) {
  const gutter = SHELL_GUTTERS.find((step) => width >= step.min)!.gutter;
  return { gutter, x: Math.max(0, (width - SHELL_MAX) / 2), width: Math.min(width, SHELL_MAX) };
}

async function visit(page: Page, url: string, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.route("**/*", (route) => {
    const hostname = new URL(route.request().url()).hostname;
    return ["localhost", "127.0.0.1"].includes(hostname) ? route.continue() : route.abort();
  });
  await page.goto(url, { waitUntil: "load" });
}

type Metrics = {
  shell: { label: string; x: number; width: number }[];
  brand: { x: number; y: number };
  logo: number;
  wordmark: { size: number; weight: string; family: string };
  brandGap: string;
  body: number;
  article: number;
  overview: number;
  menu: { visible: boolean; x: number };
};

async function metrics(page: Page, site: "website" | "docs"): Promise<Metrics> {
  return page.evaluate((which) => {
    const round = (value: number) => Math.round(value * 100) / 100;
    const element = (selector: string) => {
      const found = document.querySelector(selector);
      if (!found) throw new Error(`missing ${selector}`);
      return found;
    };
    const metricsOf = (node: Element) => {
      const box = node.getBoundingClientRect();
      return { x: round(box.x), width: round(box.width) };
    };
    const rect = (selector: string) => {
      const box = element(selector).getBoundingClientRect();
      return { x: round(box.x), y: round(box.y), width: round(box.width) };
    };
    const label = (node: Element) => [node.tagName.toLowerCase(), ...node.classList].join(".");

    const shell =
      which === "website"
        ? [...document.querySelectorAll(".shell, .wrap")].map((node) => ({ label: label(node), ...metricsOf(node) }))
        : [".topbar-inner", ".layout", ".footer-inner"].map((selector) => ({
            label: selector,
            ...metricsOf(element(selector)),
          }));

    const brandSelector = which === "website" ? "header.site-header .brand" : "header.topbar .brand";
    const wordmarkSelector = which === "website" ? brandSelector : ".brand-name";
    const brandBox = rect(brandSelector);
    const brandStyle = getComputedStyle(document.querySelector(brandSelector)!);
    const wordmarkStyle = getComputedStyle(document.querySelector(wordmarkSelector)!);
    const toggle = document.querySelector("#menu-toggle");

    return {
      shell,
      brand: { x: brandBox.x, y: brandBox.y },
      logo: rect(`${brandSelector} img`).width,
      wordmark: {
        size: parseFloat(wordmarkStyle.fontSize),
        weight: wordmarkStyle.fontWeight,
        family: wordmarkStyle.fontFamily,
      },
      brandGap: brandStyle.gap,
      body: parseFloat(getComputedStyle(document.body).fontSize),
      article: which === "docs" ? rect("main article").width : 0,
      overview: document.documentElement.scrollWidth - window.innerWidth,
      menu: toggle
        ? {
            visible: getComputedStyle(toggle).display !== "none",
            x: round(toggle.getBoundingClientRect().x),
          }
        : { visible: false, x: -1 },
    };
  }, site);
}

for (const viewport of VIEWPORTS) {
  const width = viewport.width;
  const expected = shell(width);
  const brandX = expected.x + expected.gutter;
  const wordmarkSize = width < WORDMARK_BREAKPOINT ? WORDMARK_NARROW : WORDMARK_WIDE;
  const bodySize = width < WORDMARK_BREAKPOINT ? BODY_NARROW : BODY_WIDE;

  test(`${width}px: shared shell, brand geometry and body type`, async ({ page }, testInfo) => {
    await visit(page, WEBSITE, width, viewport.height);
    const website = await metrics(page, "website");

    await page.goto(DOCS);
    const docs = await metrics(page, "docs");

    for (const [name, site] of [
      ["website", website],
      ["docs", docs],
    ] as const) {
      for (const element of site.shell) {
        expect.soft(element.width, `${name} ${element.label} width`).toBeCloseTo(expected.width, 0);
        expect.soft(element.x, `${name} ${element.label} x`).toBeCloseTo(expected.x, 0);
      }
      expect.soft(site.overview, `${name} must not overflow horizontally`).toBeLessThanOrEqual(0);
    }

    expect.soft(website.body, "website body type").toBeCloseTo(bodySize, 1);
    expect.soft(docs.body, "docs body type").toBeCloseTo(bodySize, 1);
    expect.soft(docs.article, "docs article measure").toBeGreaterThan(0);
    expect.soft(docs.article, "docs article measure").toBeLessThanOrEqual(720);

    for (const [name, site] of [
      ["website", website],
      ["docs", docs],
    ] as const) {
      expect.soft(site.brand.x, `${name} brand x`).toBeCloseTo(brandX, 0);
      expect.soft(site.logo, `${name} logo size`).toBeCloseTo(LOGO, 0);
      expect.soft(site.wordmark.size, `${name} wordmark size`).toBeCloseTo(wordmarkSize, 1);
      expect.soft(site.wordmark.weight, `${name} wordmark weight`).toBe("600");
    }

    expect.soft(docs.brand.x, "both brands share one x").toBeCloseTo(website.brand.x, 0);
    expect.soft(docs.brand.y, "both brands share one y").toBeCloseTo(website.brand.y, 0);
    expect.soft(docs.wordmark.family, "both wordmarks share one font family").toBe(website.wordmark.family);
    expect.soft(docs.brandGap, "both brands share one gap").toBe(website.brandGap);

    if (width <= 900) {
      expect.soft(docs.menu.visible, "the docs menu control shows on narrow viewports").toBe(true);
      expect.soft(docs.menu.x, "the docs menu control must not precede the logo").toBeGreaterThan(brandX);
    }

    if (width === 1280 || width === 375) {
      await page.screenshot({ path: testInfo.outputPath(`docs-${width}.png`), fullPage: true });
      await page.goto(WEBSITE);
      await page.screenshot({ path: testInfo.outputPath(`website-${width}.png`), fullPage: true });
    }
  });
}

test("primary call to action uses the approved colours and hover", async ({ page }) => {
  await visit(page, WEBSITE, 1280, 900);

  const cta = page.locator("a.button--primary").first();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveCSS("background-color", PRIMARY);
  await expect(cta).toHaveCSS("color", WHITE);

  await cta.hover();
  await expect(cta).toHaveCSS("background-color", PRIMARY_HOVER);
  await expect(cta).toHaveCSS("color", WHITE);
});

test("the shared theme control switches both sites between Dark and Light", async ({ page }, testInfo) => {
  for (const [name, url] of [
    ["website", WEBSITE],
    ["docs", DOCS],
  ] as const) {
    await visit(page, url, 1280, 900);

    const root = page.locator("html");
    const toggle = page.locator(".theme-toggle").first();
    await expect(toggle).toBeVisible();

    await toggle.click();
    await page.getByRole("menuitemcheckbox", { name: "Dark", exact: true }).click();
    await expect(root).toHaveAttribute("data-theme", "dark");

    if (name === "website") {
      const cta = page.locator("a.button--primary").first();
      await expect(cta).toBeVisible();
      await expect(cta).toHaveCSS("background-color", PRIMARY);
      await expect(cta).toHaveCSS("color", WHITE);
      await page.screenshot({ path: testInfo.outputPath("website-1280-dark.png"), fullPage: true });
      await cta.hover();
      await expect(cta).toHaveCSS("background-color", PRIMARY_HOVER);
      await expect(cta).toHaveCSS("color", WHITE);
    }

    if (name === "docs") {
      const lede = page.locator(".lede").first();
      await expect(lede).toBeVisible();
      await expect(lede).toHaveCSS("color", "rgb(166, 174, 198)");
    }

    await toggle.click();
    await page.getByRole("menuitemcheckbox", { name: "Light", exact: true }).click();
    await expect(root).toHaveAttribute("data-theme", "light");

    if (name === "website") {
      const cta = page.locator("a.button--primary").first();
      await expect(cta).toHaveCSS("background-color", PRIMARY);
      await expect(cta).toHaveCSS("color", WHITE);
    }

    if (name === "docs") {
      const lede = page.locator(".lede").first();
      await expect(lede).toHaveCSS("color", "rgb(107, 114, 128)");
    }
  }
});
