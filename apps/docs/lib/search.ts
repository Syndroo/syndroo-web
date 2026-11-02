import type { Locale } from "@syndroo/content/site-data";

export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Keep command tokens intact, while allowing unspaced Chinese input to become
 * searchable words. Intl.Segmenter is part of current Node and browsers.
 */
export function searchTokens(query: string, locale: Locale): string[] {
  const normalized = normalizeSearchText(query);
  if (normalized === "") {
    return [];
  }
  if (locale === "zh" && /\p{Script=Han}/u.test(normalized)) {
    const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
    return Array.from(segmenter.segment(normalized))
      .filter((part) => part.isWordLike)
      .map((part) => part.segment.trim())
      .filter(Boolean);
  }
  return normalized.split(" ").filter(Boolean);
}

export function matchesSearch(
  query: string,
  title: string,
  text: string,
  locale: Locale,
): boolean {
  const tokens = searchTokens(query, locale);
  if (tokens.length === 0) {
    return false;
  }
  const combined = `${normalizeSearchText(title)} ${normalizeSearchText(text)}`;
  return tokens.every((token) => combined.includes(token));
}
