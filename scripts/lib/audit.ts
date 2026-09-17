// Audits one built site directory.
//
// Checks the built output rather than the sources: every local `href`, `src` and
// CSS `url()` must resolve inside the output, every fragment must have a target
// element, ids must be unique, each page must be English with one `h1`, and the
// output must contain no sources, maps, provenance or unresolved loopback
// origins.
import { lstat, readFile } from "node:fs/promises";
import { posix, relative } from "node:path";
import {
  PUBLISHABLE_EXTENSIONS,
  TEXT_EXTENSIONS,
  extensionOf,
  isIgnoredName,
  listFiles,
  toPosix,
} from "./files.ts";
import { DEFAULT_DOCS_ORIGIN, DEFAULT_WEBSITE_ORIGIN, type Origins } from "./origins.ts";

export type AuditIssue = {
  file: string;
  line?: number;
  message: string;
};

export type AuditSummary = {
  distRoot: string;
  files: number;
  pages: number;
  references: number;
  issues: AuditIssue[];
};

export type AuditOptions = {
  distRoot: string;
  origins: Origins;
  expectedPages?: string[];
};

/** Text that must never reach a published build. */
const SOURCE_LEAK_MARKERS: ReadonlyArray<readonly [string, string]> = [
  ["sourceMappingURL", "references a source map"],
  ["file://", "contains a file:// URL"],
  ["/Users/", "contains an absolute local path"],
  ["/private/var/", "contains an absolute local path"],
  ["packages/brand", "contains a repository source path"],
  ["PROVENANCE", "contains provenance text"],
];

const HTML_REFERENCE = /\b(href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const CSS_REFERENCE = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi;
const IMG_TAG = /<img\b[^>]*>/gi;
const H1_TAG = /<h1\b/gi;
const ID_ATTRIBUTE = /(?<![-\w:])(id)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const ANCHOR_NAME = /<a\b[^>]*\b(name)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const LABELLED_BY = /\b(aria-labelledby|aria-describedby)\s*=\s*("([^"]*)"|'([^']*)')/gi;

type ReferenceTarget =
  | { kind: "ignored" }
  | { kind: "external" }
  | { kind: "invalid"; reason: string }
  | { kind: "local"; target: string; fragment: string };

type PageInfo = {
  text: string;
  ids: Set<string>;
};

function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") {
      line += 1;
    }
  }
  return line;
}

function attributeValue(match: RegExpExecArray): string {
  return match[2] !== undefined ? (match[3] ?? match[4] ?? "") : "";
}

/** Classify one reference written in a page. */
export function classifyReference(value: string, pageRel: string): ReferenceTarget {
  const ref = value.trim();
  if (ref === "") {
    return { kind: "invalid", reason: "empty reference" };
  }
  if (/^javascript:/i.test(ref)) {
    return { kind: "invalid", reason: "javascript: URL" };
  }
  if (/^data:|^mailto:|^tel:/i.test(ref)) {
    return { kind: "ignored" };
  }
  if (ref.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(ref)) {
    return { kind: "external" };
  }

  const hashIndex = ref.indexOf("#");
  const pathPart = hashIndex === -1 ? ref : ref.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : ref.slice(hashIndex + 1);
  const cleanPath = pathPart.split("?")[0];

  let decoded: string;
  try {
    decoded = decodeURIComponent(cleanPath);
  } catch {
    return { kind: "invalid", reason: "malformed percent-encoding" };
  }
  if (decoded.includes("\0")) {
    return { kind: "invalid", reason: "contains a NUL byte" };
  }

  let target: string;
  if (decoded === "") {
    target = pageRel;
  } else {
    const joined = decoded.startsWith("/")
      ? decoded.slice(1)
      : posix.join(posix.dirname(pageRel), decoded);
    const normalized = posix.normalize(joined);
    if (normalized.startsWith("..")) {
      return { kind: "invalid", reason: "escapes the build output" };
    }
    target = normalized === "." ? "" : normalized;
  }

  return { kind: "local", target, fragment };
}

function findTarget(target: string, files: ReadonlySet<string>): string | null {
  const candidates =
    target === ""
      ? ["index.html"]
      : target.endsWith("/")
        ? [`${target}index.html`]
        : [target, `${target}/index.html`];

  for (const candidate of candidates) {
    if (files.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

export async function auditDist(options: AuditOptions): Promise<AuditSummary> {
  const { distRoot, origins } = options;
  const issues: AuditIssue[] = [];
  // Hidden files and symlinks are listed on purpose: the audit reports them,
  // while a build and a server skip them.
  const absoluteFiles = await listFiles(distRoot, { includeHidden: true, includeSymlinks: true });

  if (absoluteFiles.length === 0) {
    return {
      distRoot,
      files: 0,
      pages: 0,
      references: 0,
      issues: [{ file: distRoot, message: "no build output found (run the build first)" }],
    };
  }

  const files = new Set<string>();
  const texts = new Map<string, string>();

  for (const absolute of absoluteFiles) {
    const rel = toPosix(relative(distRoot, absolute));
    files.add(rel);

    if ((await lstat(absolute)).isSymbolicLink()) {
      issues.push({ file: rel, message: "symlink in build output" });
      continue;
    }

    const extension = extensionOf(absolute);
    if (!PUBLISHABLE_EXTENSIONS.has(extension)) {
      issues.push({
        file: rel,
        message: `not a publishable file type (${extension === "" ? "no extension" : extension})`,
      });
    }
    if (rel.split("/").some((segment) => segment.startsWith("."))) {
      issues.push({ file: rel, message: "hidden path in build output" });
    } else if (isIgnoredName(absolute)) {
      issues.push({ file: rel, message: "configuration file in build output" });
    }

    if (TEXT_EXTENSIONS.has(extension)) {
      const text = await readFile(absolute, "utf8");
      texts.set(rel, text);
      for (const [marker, message] of SOURCE_LEAK_MARKERS) {
        const at = text.indexOf(marker);
        if (at !== -1) {
          issues.push({ file: rel, line: lineOf(text, at), message: `build output ${message} (${marker})` });
        }
      }
      if (text.includes("\r")) {
        issues.push({ file: rel, message: "build output contains CR characters" });
      }
    }
  }

  for (const expected of options.expectedPages ?? []) {
    if (!files.has(expected)) {
      issues.push({ file: expected, message: "expected page is missing from the build output" });
    }
  }

  // Origin hygiene: an original loopback origin may survive in the output only
  // when it is itself one of the configured origins. A build configured as
  // `WEBSITE_ORIGIN=http://localhost:4174` legitimately keeps that string.
  const configured = new Set([origins.website, origins.docs]);
  const defaultsToCheck = [DEFAULT_WEBSITE_ORIGIN, DEFAULT_DOCS_ORIGIN].filter(
    (origin) => !configured.has(origin),
  );
  if (defaultsToCheck.length > 0) {
    for (const [rel, text] of texts) {
      for (const origin of defaultsToCheck) {
        const at = text.indexOf(origin);
        if (at !== -1) {
          issues.push({
            file: rel,
            line: lineOf(text, at),
            message: `cross-site link still points at ${origin}; rebuild with the configured origin`,
          });
        }
      }
    }
  }

  const pages = new Map<string, PageInfo>();
  for (const [rel, text] of texts) {
    if (extensionOf(rel) !== ".html") {
      continue;
    }
    const ids = new Set<string>();
    for (const pattern of [ID_ATTRIBUTE, ANCHOR_NAME]) {
      pattern.lastIndex = 0;
      for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
        const id = attributeValue(match);
        if (id === "") {
          continue;
        }
        if (ids.has(id)) {
          issues.push({ file: rel, line: lineOf(text, match.index), message: `duplicate id "${id}"` });
        }
        ids.add(id);
      }
    }
    pages.set(rel, { text, ids });
  }

  let referenceCount = 0;

  for (const [rel, page] of pages) {
    const { text, ids } = page;

    if (!/^<!doctype html>/i.test(text.trimStart())) {
      issues.push({ file: rel, message: "page does not start with <!doctype html>" });
    }

    const htmlTag = /<html\b[^>]*>/i.exec(text);
    if (!htmlTag) {
      issues.push({ file: rel, message: "page has no <html> element" });
    } else if (!/\blang\s*=\s*"en"/i.test(htmlTag[0])) {
      issues.push({ file: rel, message: "page language is not English (lang=\"en\")" });
    }

    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text);
    if (!title || title[1].trim() === "") {
      issues.push({ file: rel, message: "page has no non-empty <title>" });
    }

    H1_TAG.lastIndex = 0;
    let h1Count = 0;
    while (H1_TAG.exec(text) !== null) {
      h1Count += 1;
    }
    if (h1Count !== 1) {
      issues.push({ file: rel, message: `page has ${h1Count} h1 element(s), expected exactly 1` });
    }

    IMG_TAG.lastIndex = 0;
    for (let match = IMG_TAG.exec(text); match !== null; match = IMG_TAG.exec(text)) {
      if (!/\balt\s*=/i.test(match[0])) {
        issues.push({ file: rel, line: lineOf(text, match.index), message: "<img> is missing an alt attribute" });
      }
    }

    LABELLED_BY.lastIndex = 0;
    for (let match = LABELLED_BY.exec(text); match !== null; match = LABELLED_BY.exec(text)) {
      for (const id of attributeValue(match).split(/\s+/).filter((value) => value !== "")) {
        if (!ids.has(id)) {
          issues.push({
            file: rel,
            line: lineOf(text, match.index),
            message: `aria reference "${id}" has no matching id`,
          });
        }
      }
    }

    HTML_REFERENCE.lastIndex = 0;
    for (let match = HTML_REFERENCE.exec(text); match !== null; match = HTML_REFERENCE.exec(text)) {
      referenceCount += 1;
      const outcome = classifyReference(attributeValue(match), rel);
      const line = lineOf(text, match.index);

      if (outcome.kind === "ignored" || outcome.kind === "external") {
        continue;
      }
      if (outcome.kind === "invalid") {
        issues.push({ file: rel, line, message: `reference "${attributeValue(match)}" is invalid: ${outcome.reason}` });
        continue;
      }

      const target = findTarget(outcome.target, files);
      if (target === null) {
        issues.push({
          file: rel,
          line,
          message: `reference "${attributeValue(match)}" does not resolve to a file in the build output`,
        });
        continue;
      }
      if (outcome.fragment !== "" && extensionOf(target) === ".html") {
        const targetPage = pages.get(target);
        if (targetPage && !targetPage.ids.has(outcome.fragment)) {
          issues.push({
            file: rel,
            line,
            message: `fragment "#${outcome.fragment}" has no target in ${target}`,
          });
        }
      }
    }
  }

  for (const [rel, text] of texts) {
    if (extensionOf(rel) !== ".css") {
      continue;
    }
    CSS_REFERENCE.lastIndex = 0;
    for (let match = CSS_REFERENCE.exec(text); match !== null; match = CSS_REFERENCE.exec(text)) {
      const value = match[1] ?? match[2] ?? match[3] ?? "";
      if (value === "" || /^(data:|https?:|\/\/|#)/i.test(value)) {
        continue;
      }
      referenceCount += 1;
      const outcome = classifyReference(value, rel);
      const line = lineOf(text, match.index);
      if (outcome.kind === "invalid") {
        issues.push({ file: rel, line, message: `url(${value}) is invalid: ${outcome.reason}` });
        continue;
      }
      if (outcome.kind !== "local") {
        continue;
      }
      if (findTarget(outcome.target, files) === null) {
        issues.push({
          file: rel,
          line,
          message: `url(${value}) does not resolve to a file in the build output`,
        });
      }
    }
  }

  issues.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file < b.file ? -1 : 1;
    }
    return (a.line ?? 0) - (b.line ?? 0);
  });

  return {
    distRoot,
    files: absoluteFiles.length,
    pages: pages.size,
    references: referenceCount,
    issues,
  };
}
