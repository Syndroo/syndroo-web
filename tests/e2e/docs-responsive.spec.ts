import { expect, test, type Page } from "playwright/test";
import { docsPages } from "../../packages/content/site-data.ts";

const DOCS = "http://127.0.0.1:4174";

const WIDTHS = [
  320, 360, 375, 390, 430, 639, 640, 719, 720, 767, 768, 899, 900, 901, 1023, 1024, 1099, 1100, 1199, 1200,
  1280, 1440,
] as const;

const GUTTERS = [
  { min: 1200, gutter: 80 },
  { min: 900, gutter: 56 },
  { min: 640, gutter: 40 },
  { min: 380, gutter: 24 },
  { min: 0, gutter: 20 },
] as const;

const ARTICLE_MAX = 720;

function gutterFor(width: number): number {
  return GUTTERS.find((step) => width >= step.min)!.gutter;
}

async function visit(page: Page, path: string, width: number, height = 900): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.route("**/*", (route) => {
    const hostname = new URL(route.request().url()).hostname;
    return ["localhost", "127.0.0.1"].includes(hostname) ? route.continue() : route.abort();
  });
  await page.goto(`${DOCS}${path}`, { waitUntil: "load" });
  await page.waitForFunction(() => {
    const topbar = document.querySelector(".topbar");
    const drawer = document.querySelector("#docs-sidebar");
    if (!topbar || !drawer) return false;
    const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-offset"));
    if (!Number.isFinite(offset) || Math.abs(offset - topbar.getBoundingClientRect().height) > 0.6) return false;
    return innerWidth > 900 ? !drawer.hasAttribute("inert") : drawer.hasAttribute("inert");
  });
}

async function openDrawer(page: Page): Promise<void> {
  await page.click("#menu-toggle");
  await expect(page.locator("#docs-sidebar")).toHaveClass(/is-open/);
  await page.waitForFunction(() => document.querySelector("#docs-sidebar")!.getBoundingClientRect().left >= -0.5);
}

type Report = {
  docOverflow: number;
  offenders: string[];
  actionCollisions: string[];
  article: number;
  brandLeft: number;
  brandRight: number;
  actionsLeft: number;
  headerVar: number;
  topbarVar: number;
  topbarOffsetVar: number;
  topbarInnerHeight: number;
  topbarHeight: number;
  drawer: { left: number; right: number } | null;
};

async function report(page: Page): Promise<Report> {
  return page.evaluate(() => {
    const round = (value: number) => Math.round(value * 100) / 100;
    const vw = window.innerWidth;
    const style = (node: Element) => getComputedStyle(node);
    const shown = (node: Element) => {
      const own = style(node);
      if (own.display === "none" || own.visibility === "hidden") return false;
      const box = node.getBoundingClientRect();
      return box.width > 0.5 && box.height > 0.5;
    };
    const hidden = (node: Element) => {
      let cursor: Element | null = node;
      while (cursor && cursor !== document.body) {
        if (cursor.hasAttribute("inert") || cursor.getAttribute("aria-hidden") === "true") return true;
        cursor = cursor.parentElement;
      }
      return false;
    };
    const name = (node: Element) =>
      node.tagName.toLowerCase() +
      (node.id ? `#${node.id}` : "") +
      (node.classList.length ? `.${[...node.classList].join(".")}` : "");
    const scrolls = (node: Element) => {
      let cursor = node.parentElement;
      while (cursor && cursor !== document.documentElement) {
        const overflow = style(cursor).overflowX;
        if (overflow === "auto" || overflow === "scroll") return true;
        cursor = cursor.parentElement;
      }
      return false;
    };
    const number = (node: Element, prop: string) =>
      round(parseFloat(style(node).getPropertyValue(prop)) || 0);

    const root = document.documentElement;
    const offenders: string[] = [];
    for (const node of document.querySelectorAll("body *")) {
      if (!shown(node) || hidden(node) || scrolls(node)) continue;
      const box = node.getBoundingClientRect();
      if (box.right > vw + 1 || box.left < -1) {
        offenders.push(`${name(node)} [${round(box.left)}, ${round(box.right)}]`);
      }
    }

    const topbar = document.querySelector(".topbar")!;
    const inner = document.querySelector(".topbar-inner")!;
    const actions = document.querySelector(".topbar-actions")!;
    const brand = document.querySelector(".topbar .brand")!;
    const article = document.querySelector("main article")!;
    const drawer = document.querySelector(".sidebar");

    const controls = [...actions.children].filter(shown);
    const actionCollisions: string[] = [];
    for (let index = 1; index < controls.length; index += 1) {
      const previous = controls[index - 1].getBoundingClientRect();
      const current = controls[index].getBoundingClientRect();
      if (current.left < previous.right - 1) {
        actionCollisions.push(`${name(controls[index - 1])} / ${name(controls[index])}`);
      }
    }

    const brandBox = brand.getBoundingClientRect();
    const actionsBox = actions.getBoundingClientRect();

    return {
      docOverflow: round(root.scrollWidth - vw),
      offenders: [...new Set(offenders)].slice(0, 8),
      actionCollisions,
      article: round(article.getBoundingClientRect().width),
      brandLeft: round(brandBox.left),
      brandRight: round(brandBox.right),
      actionsLeft: round(actionsBox.left),
      headerVar: number(root, "--header-h"),
      topbarVar: number(root, "--topbar-h"),
      topbarOffsetVar: number(root, "--topbar-offset"),
      topbarInnerHeight: round(inner.getBoundingClientRect().height),
      topbarHeight: round(topbar.getBoundingClientRect().height),
      drawer: drawer
        ? { left: round(drawer.getBoundingClientRect().left), right: round(drawer.getBoundingClientRect().right) }
        : null,
    };
  });
}

test("docs pages hold the shared shell metrics without viewport overflow", async ({ page }, testInfo) => {
  const paths = docsPages.map((entry) => entry.path);

  for (const width of WIDTHS) {
    const gutter = gutterFor(width);
    const headerHeight = width >= 640 ? 88 : 72;

    for (const path of paths) {
      await visit(page, path, width);
      const measured = await report(page);
      const where = `${path} at ${width}px`;

      expect.soft(measured.docOverflow, `${where} must not overflow the viewport`).toBeLessThanOrEqual(0);
      expect.soft(measured.offenders, `${where} must not push content off-screen`).toEqual([]);
      expect.soft(measured.actionCollisions, `${where} topbar controls must not collide`).toEqual([]);
      expect.soft(measured.brandRight, `${where} brand must clear the topbar actions`).toBeLessThanOrEqual(
        measured.actionsLeft,
      );

      expect.soft(measured.topbarVar, `${where} --topbar-h must follow --header-h`).toBe(measured.headerVar);
      expect.soft(measured.headerVar, `${where} shared header height`).toBe(headerHeight);
      expect.soft(measured.topbarInnerHeight, `${where} rendered topbar row`).toBe(headerHeight);
      expect.soft(measured.topbarOffsetVar, `${where} sticky offset must match the rendered topbar`).toBeCloseTo(
        measured.topbarHeight,
        0,
      );

      expect.soft(measured.brandLeft, `${where} brand left must equal the shared gutter`).toBe(gutter);
      expect.soft(measured.article, `${where} article measure`).toBeGreaterThan(0);
      expect.soft(measured.article, `${where} article measure`).toBeLessThanOrEqual(ARTICLE_MAX);
    }

    if (width === 375 || width === 1440) {
      await visit(page, "/", width);
      await page.screenshot({ path: testInfo.outputPath(`docs-${width}.png`), fullPage: true });
    }
  }
});

test("the mobile drawer and the search dialog stay inside narrow viewports", async ({ page }, testInfo) => {
  for (const width of [320, 375, 430, 768]) {
    await visit(page, "/reference/cli/", width);

    await openDrawer(page);
    const opened = await report(page);
    expect.soft(opened.drawer!.left, `drawer must not hang off the left edge at ${width}px`).toBeGreaterThanOrEqual(
      -0.5,
    );
    expect.soft(opened.drawer!.right, `drawer must fit at ${width}px`).toBeLessThanOrEqual(width + 0.5);
    expect.soft(opened.docOverflow, `open drawer must not overflow the viewport at ${width}px`).toBeLessThanOrEqual(0);

    if (width === 375) {
      await page.screenshot({ path: testInfo.outputPath("docs-375-drawer.png") });
    }

    await page.keyboard.press("Escape");
    await expect(page.locator("#docs-sidebar")).not.toHaveClass(/is-open/);

    await page.click(".search-trigger");
    await page.fill("#search-input", "publish");
    await expect(page.locator("#search-results a").first()).toBeVisible();
    const searched = await report(page);
    expect.soft(searched.docOverflow, `open search must not overflow the viewport at ${width}px`).toBeLessThanOrEqual(0);

    const panel = (await page.locator(".search-panel").boundingBox())!;
    expect.soft(panel.x, `search panel inside the viewport at ${width}px`).toBeGreaterThanOrEqual(0);
    expect.soft(panel.x + panel.width, `search panel inside the viewport at ${width}px`).toBeLessThanOrEqual(width);

    if (width === 375) {
      await page.screenshot({ path: testInfo.outputPath("docs-375-search.png") });
    }

    await page.keyboard.press("Escape");
  }
});

test("landscape phones keep the sticky chrome and drawer on screen", async ({ page }) => {
  for (const [width, height] of [
    [812, 375],
    [667, 375],
    [1024, 600],
  ] as const) {
    await visit(page, "/", width, height);
    const measured = await report(page);
    expect.soft(measured.docOverflow, `${width}x${height} must not overflow`).toBeLessThanOrEqual(0);
    expect.soft(measured.offenders, `${width}x${height} must not push content off-screen`).toEqual([]);
    expect.soft(measured.actionCollisions, `${width}x${height} topbar controls must not collide`).toEqual([]);

    if (width <= 900) {
      await openDrawer(page);
      const opened = await report(page);
      expect.soft(opened.drawer!.left, `drawer off the left edge at ${width}x${height}`).toBeGreaterThanOrEqual(-0.5);
      expect.soft(opened.drawer!.right, `drawer too wide at ${width}x${height}`).toBeLessThanOrEqual(width + 0.5);
    }
  }
});
