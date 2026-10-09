import { expect, test, type Page } from "playwright/test";

const WEBSITE = "http://127.0.0.1:4173/";
const HEADER_CTA_MIN = 360;
const MENU_MAX = 1023;

const WIDTHS = [320, 360, 375, 390, 430, 639, 640, 719, 720, 767, 768, 1023, 1024, 1099, 1100, 1280, 1440, 1920];

type Audit = {
  overflow: number;
  clipped: string[];
  occluded: string[];
  headerSqueezed: boolean;
  ctaVisible: boolean;
  burgerVisible: boolean;
  fonts: string[];
  externalRequests: string[];
};

async function visit(page: Page, width: number, height = 900): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.route("**/*", (route) => {
    const hostname = new URL(route.request().url()).hostname;
    return ["localhost", "127.0.0.1"].includes(hostname) ? route.continue() : route.abort();
  });
  await page.goto(WEBSITE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
}

async function audit(page: Page): Promise<Audit> {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return false;
      if (style.clipPath && style.clipPath.includes("inset(50%)")) return false;
      if (element.classList.contains("skip-link")) return false;
      if (element.closest("[hidden]")) return false;
      const closed = element.closest("details:not([open])");
      if (closed && !element.closest("summary")) return false;
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    };
    const name = (element: Element) =>
      `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.classList.length ? `.${[...element.classList].join(".")}` : ""}`;

    const clipped: string[] = [];
    for (const element of document.querySelectorAll("body *")) {
      if (!visible(element)) continue;
      if (!["hidden", "clip"].includes(getComputedStyle(element).overflowX)) continue;
      if (element.scrollWidth > element.clientWidth + 1) {
        clipped.push(`${name(element)} ${element.scrollWidth}>${element.clientWidth}`);
      }
    }

    const occluded: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = node.textContent.trim();
      const owner = node.parentElement;
      if (text.length === 0 || !owner || !visible(owner)) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width < 1 || rect.height < 1) continue;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        if (centerX < 0 || centerY < 0 || centerX > window.innerWidth || centerY > window.innerHeight) continue;
        const hit = document.elementFromPoint(centerX, centerY);
        if (!hit) continue;
        if (owner === hit || owner.contains(hit) || hit.contains(owner)) continue;
        occluded.push(`"${text.slice(0, 24)}" (${name(owner)}) under ${name(hit)}`);
      }
    }

    const actions = document.querySelector(".site-header__actions")!;
    const cta = document.querySelector(".site-header__cta")!;
    const burger = document.querySelector(".nav-toggle")!;

    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      clipped,
      occluded,
      headerSqueezed: actions.scrollWidth > actions.clientWidth + 1,
      ctaVisible: getComputedStyle(cta).display !== "none",
      burgerVisible: getComputedStyle(burger).display !== "none",
      fonts: [...document.fonts].map((font) => font.family),
      externalRequests: performance
        .getEntriesByType("resource")
        .map((entry) => new URL(entry.name).hostname)
        .filter((host) => host !== "127.0.0.1" && host !== "localhost"),
    };
  });
}

for (const width of WIDTHS) {
  test(`${width}px: content fits without overflow, clipping or occlusion`, async ({ page }) => {
    await visit(page, width);
    const result = await audit(page);

    expect.soft(result.overflow, "no horizontal overflow").toBeLessThanOrEqual(0);
    expect.soft(result.clipped, "nothing is clipped by its own box").toEqual([]);
    expect.soft(result.occluded, "no readable text is covered").toEqual([]);
    expect.soft(result.headerSqueezed, "header controls keep their own width").toBe(false);
    expect.soft(result.externalRequests, "no third-party request").toEqual([]);
    expect.soft(result.fonts, "the self-hosted families load").toContain("Prompt");
    expect.soft(result.fonts, "the self-hosted families load").toContain("Inter");

    if (width < HEADER_CTA_MIN) {
      expect.soft(result.ctaVisible, "the duplicate header CTA steps aside").toBe(false);
      expect.soft(result.burgerVisible, "the menu control remains").toBe(true);
    } else {
      expect.soft(result.burgerVisible, `the menu control hides at ${width}`).toBe(width <= MENU_MAX);
    }
  });
}

test("the header CTA remains reachable from the menu once it is hidden", async ({ page }) => {
  await visit(page, 320);

  const toggle = page.locator(".nav-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#site-menu")).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#site-menu")).toBeVisible();
  await expect(page.locator("#site-menu a", { hasText: "Build from source" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#site-menu")).toBeHidden();
});

test("the open menu sits below the header and leaves the brand clear", async ({ page }) => {
  for (const width of [320, 375, 768, MENU_MAX]) {
    await visit(page, width, 720);
    await page.locator(".nav-toggle").click();

    const headerBar = await page.locator(".site-header__inner").boundingBox();
    const menu = await page.locator("#site-menu").boundingBox();
    const brand = await page.locator(".site-header .brand").boundingBox();
    expect(headerBar, `${width} header bar`).not.toBeNull();
    expect(menu, `${width} menu`).not.toBeNull();
    expect(brand, `${width} brand`).not.toBeNull();

    expect(menu!.y, `${width} menu starts below the header bar`).toBeGreaterThanOrEqual(
      headerBar!.y + headerBar!.height,
    );
    expect(menu!.x, `${width} menu is inside the viewport`).toBeGreaterThanOrEqual(0);
    expect(menu!.x + menu!.width, `${width} menu is inside the viewport`).toBeLessThanOrEqual(width);
    expect(brand!.y + brand!.height, `${width} brand stays inside the header bar`).toBeLessThanOrEqual(
      headerBar!.y + headerBar!.height,
    );

    const result = await audit(page);
    expect.soft(result.overflow, `${width} open menu overflow`).toBeLessThanOrEqual(0);
    expect.soft(result.occluded, `${width} open menu occlusion`).toEqual([]);
  }
});

test("the JSON sample on the page parses", async ({ page }) => {
  await visit(page, 1280);

  const samples = await page.locator("pre.code").allInnerTexts();
  expect(samples.length).toBeGreaterThan(0);
  for (const sample of samples) {
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    // The sample is a v1 publish document: `content` is an object and
    // `targets` names the providers, matching the documented request shape.
    expect(Object.keys(parsed)).toEqual(["content", "targets"]);
    expect(parsed.content).toEqual({ text: "One document, chosen targets." });
    expect(parsed.targets).toEqual([{ provider: "bluesky" }, { provider: "linkedin" }]);
  }
});
