import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_LOCALE,
  counterpartPath,
  docsNavZh,
  docsPages,
  docsPagesEn,
  docsPagesZh,
  htmlLangByLocale,
  localizePath,
  primaryNavZh,
  ui,
  websitePages,
  websitePagesEn,
  websitePagesZh,
} from "../packages/content/site-data.ts";
import { localizeCodeLabel } from "../apps/docs/lib/code-labels.ts";
import { matchesSearch, searchTokens } from "../apps/docs/lib/search.ts";

test("English stays default while Chinese routes are explicit mirrors", () => {
  assert.equal(DEFAULT_LOCALE, "en");
  assert.equal(htmlLangByLocale.en, "en");
  assert.equal(htmlLangByLocale.zh, "zh-CN");
  assert.equal(localizePath("en", "/reference/cli/"), "/reference/cli/");
  assert.equal(localizePath("zh", "/reference/cli/"), "/zh/reference/cli/");
  assert.equal(localizePath("zh", "/"), "/zh/");
  assert.equal(
    counterpartPath("en", "/platforms/bluesky/#overview"),
    "/zh/platforms/bluesky/#overview",
  );
  assert.equal(counterpartPath("zh", "/zh/#faq"), "/#faq");
});

test("both sites register one English and one Chinese counterpart for every page", () => {
  assert.equal(websitePages.length, 2);
  assert.equal(websitePagesEn.length, 1);
  assert.equal(websitePagesZh.length, 1);
  assert.equal(docsPages.length, 32);
  assert.equal(docsPagesEn.length, 16);
  assert.equal(docsPagesZh.length, 16);

  for (let index = 0; index < docsPagesEn.length; index += 1) {
    assert.equal(counterpartPath("en", docsPagesEn[index].path), docsPagesZh[index].path);
    assert.equal(counterpartPath("zh", docsPagesZh[index].path), docsPagesEn[index].path);
  }
});

test("Chinese chrome and navigation use translated labels and same-language links", () => {
  assert.equal(ui.en.theme.dark, "Dark");
  assert.equal(ui.zh.theme.dark, "深色");
  assert.equal(ui.zh.docs.searchDocs, "搜索文档");
  assert.equal(ui.zh.docs.copy, "复制");
  for (const item of primaryNavZh.filter((entry) => entry.href.startsWith("/"))) {
    assert.ok(item.href.startsWith("/zh/"), `${item.label} should stay in Chinese`);
  }
  for (const group of docsNavZh) {
    for (const item of group.items) {
      assert.ok(item.href.startsWith("/zh/"), `${item.href} should stay in Chinese docs`);
    }
  }
});

test("Chinese search tokenizes unspaced queries and matches Chinese page text", () => {
  assert.ok(searchTokens("本地发布", "zh").length > 0);
  assert.equal(matchesSearch("本地发布", "本地 CLI", "准备然后发布内容。", "zh"), true);
  assert.equal(matchesSearch("连接 Threads", "Threads", "连接账号后发布。", "zh"), true);
  assert.equal(matchesSearch("local release", "本地 CLI", "准备然后发布内容。", "zh"), false);
});


test("Chinese injected code labels translate prose and preserve technical names", () => {
  assert.equal(localizeCodeLabel("zh", "terminal"), "终端");
  assert.equal(localizeCodeLabel("zh", "agent prompt"), "智能体提示词");
  assert.equal(localizeCodeLabel("zh", "callback"), "回调地址");
  assert.equal(localizeCodeLabel("zh", "post.json"), "post.json");
  assert.equal(localizeCodeLabel("zh", "SYNDROO_CREDENTIALS"), "SYNDROO_CREDENTIALS");
  assert.equal(localizeCodeLabel("en", "terminal"), "terminal");
});
