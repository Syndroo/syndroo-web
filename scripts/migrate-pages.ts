// One-shot migration helper: legacy authored HTML -> Next.js App Router.
//
// The v0.4.0 change request (CR-040-04) moves both sites to Next.js App Router
// without rewriting brand or content. Rewriting 22 authored pages by hand would
// be exactly the content rewrite the CR forbids, so this script converts the
// existing page bodies mechanically and refuses anything it cannot map exactly:
//
//   - the shared header/footer/sidebar chrome becomes a Next.js layout, so a
//     page only carries the markup between the legacy chrome markers;
//   - `class`/`for` and hyphenated SVG attributes become JSX attributes;
//   - text that JSX or MDX would otherwise parse as syntax is emitted as an
//     explicit string expression, so the rendered characters do not change;
//   - inline `style` declarations become React style objects;
//   - code samples always become string expressions, because they contain
//     braces, backticks and `${}` that MDX would otherwise evaluate.
//
// Anything unexpected throws instead of being silently dropped.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** HTML entities that appear in the authored pages. */
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: String.fromCharCode(160),
  copy: String.fromCharCode(169),
  mdash: String.fromCharCode(8212),
  ndash: String.fromCharCode(8211),
  hellip: String.fromCharCode(8230),
  times: String.fromCharCode(215),
  middot: String.fromCharCode(183),
  uarr: String.fromCharCode(8593),
  darr: String.fromCharCode(8595),
  larr: String.fromCharCode(8592),
  rarr: String.fromCharCode(8594),
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    }
    if (body.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    }
    const mapped = ENTITIES[body];
    if (mapped === undefined) {
      throw new Error(`unmapped HTML entity ${match}`);
    }
    return mapped;
  });
}

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** SVG elements that the authored sources always write without children. */
const SELF_CLOSING_SVG = new Set(["path", "circle", "rect", "line", "polyline", "polygon", "use"]);

const ATTRIBUTE_RENAMES: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  minlength: "minLength",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  spellcheck: "spellCheck",
  fetchpriority: "fetchPriority",
  crossorigin: "crossOrigin",
  srcset: "srcSet",
  datetime: "dateTime",
  enctype: "encType",
  novalidate: "noValidate",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "text-anchor": "textAnchor",
};

/** Text characters that JSX or MDX would parse as syntax. */
const RISKY_TEXT = /[{}<>*_[\]#&~|`\\]/;

function styleObject(value: string): string {
  const entries = value
    .split(";")
    .map((piece) => piece.trim())
    .filter((piece) => piece !== "");
  if (entries.length === 0) {
    throw new Error(`empty style attribute ${JSON.stringify(value)}`);
  }
  const pairs = entries.map((entry) => {
    const separator = entry.indexOf(":");
    if (separator === -1) {
      throw new Error(`cannot parse style declaration ${JSON.stringify(entry)}`);
    }
    const property = entry.slice(0, separator).trim();
    const raw = entry.slice(separator + 1).trim();
    if (/[{}]/.test(raw)) {
      throw new Error(`cannot express style value ${JSON.stringify(raw)}`);
    }
    const camel = property.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
    return `${camel}: ${JSON.stringify(raw)}`;
  });
  return `style={{ ${pairs.join(", ")} }}`;
}

/** Rewrite one tag (`<p ...>`, `</p>`, `<img ... />`) into JSX form. */
function convertTag(tag: string): string {
  const match = /^<(\/?)([a-zA-Z][-a-zA-Z0-9]*)([\s\S]*?)(\/?)>$/.exec(tag);
  if (!match) {
    throw new Error(`cannot parse tag ${JSON.stringify(tag)}`);
  }
  const closing = match[1];
  const rawName = match[2];
  const alreadyClosed = match[4];
  const name = rawName.toLowerCase();

  if (closing === "/") {
    // The opening tag was rewritten to a self-closing form above, so the
    // authored closing tag must not survive as an orphan.
    if (VOID_TAGS.has(name) || SELF_CLOSING_SVG.has(name)) {
      return "";
    }
    return `</${rawName}>`;
  }

  let attributes = match[3];
  if (/[<>]/.test(attributes)) {
    throw new Error(`attribute value contains a tag delimiter in ${JSON.stringify(tag)}`);
  }

  attributes = attributes.replace(
    /\s+style\s*=\s*"([^"]*)"/g,
    (_all, value: string) => ` ${styleObject(value)}`,
  );
  if (/\bstyle\s*=\s*["']/.test(attributes)) {
    throw new Error(`unconverted style attribute in ${JSON.stringify(tag)}`);
  }

  attributes = attributes.replace(
    /([-a-zA-Z_:][-a-zA-Z0-9_:.]*)(\s*=\s*)/g,
    (_all, rawAttribute: string, separator: string) => {
      const mapped = ATTRIBUTE_RENAMES[rawAttribute.toLowerCase()];
      if (mapped === undefined) {
        return `${rawAttribute}${separator}`;
      }
      return `${mapped}${separator}`;
    },
  );

  // React types a handful of attributes as numbers; emit them as expressions so
  // the generated page type-checks.
  attributes = attributes.replace(
    /\b(tabIndex|colSpan|rowSpan|maxLength|minLength|size|start)="(\d+)"/g,
    (_all, name: string, value: string) => `${name}={${value}}`,
  );

  const closesItself = alreadyClosed === "/" || VOID_TAGS.has(name) || SELF_CLOSING_SVG.has(name);
  return `<${rawName}${attributes}${closesItself ? " /" : ""}>`;
}

/**
 * Convert one authored HTML fragment into JSX text.
 *
 * `<code>` and `<pre>` leaf content is always emitted as a string expression so
 * that templates, braces and backticks survive verbatim.
 */
function convertFragment(fragment: string, label: string): string {
  const placeholders: string[] = [];

  const withCodePlaceholders = fragment.replace(
    /<(code|pre)\b([^>]*)>([^<]*)<\/\1>/g,
    (_all, name: string, attributes: string, body: string) => {
      if (body.trim() === "") {
        return `<${name}${attributes}></${name}>`;
      }
      const token = `@@MIGRATED-CODE-${placeholders.length}@@`;
      placeholders.push(JSON.stringify(decodeEntities(body)));
      return `<${name}${attributes}>${token}</${name}>`;
    },
  );

  const pieces: string[] = [];
  const tagPattern = /<[^>]*>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(withCodePlaceholders)) !== null) {
    pieces.push(convertText(withCodePlaceholders.slice(cursor, match.index)));
    pieces.push(convertTag(match[0]));
    cursor = match.index + match[0].length;
  }
  pieces.push(convertText(withCodePlaceholders.slice(cursor)));

  const output = pieces
    .join("")
    .replace(/@@MIGRATED-CODE-(\d+)@@/g, (_all, index: string) => `{${placeholders[Number(index)]}}`);

  if (/<\/?(script|style)\b/i.test(output)) {
    throw new Error(`${label}: authored script or style element survived conversion`);
  }
  if (output.includes("@@MIGRATED-CODE-")) {
    throw new Error(`${label}: leftover placeholder marker`);
  }
  return output;

  function convertText(text: string): string {
    if (text.trim() === "") {
      return text;
    }
    if (!RISKY_TEXT.test(text)) {
      return text;
    }
    return `{${JSON.stringify(decodeEntities(text))}}`;
  }
}

type PageMeta = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  path: string;
};

function metaContent(head: string, pattern: RegExp, label: string): string {
  const match = pattern.exec(head);
  if (!match) {
    throw new Error(`${label}: missing`);
  }
  return decodeEntities(match[1]);
}

function readMeta(head: string, label: string): PageMeta {
  const title = metaContent(head, /<title>([\s\S]*?)<\/title>/, `${label} title`);
  const description = metaContent(
    head,
    /<meta\s+name="description"\s+content="([\s\S]*?)"\s*\/?>/,
    `${label} description`,
  );
  const ogTitle = metaContent(
    head,
    /<meta\s+property="og:title"\s+content="([\s\S]*?)"\s*\/?>/,
    `${label} og:title`,
  );
  const ogDescription = metaContent(
    head,
    /<meta\s+property="og:description"\s+content="([\s\S]*?)"\s*\/?>/,
    `${label} og:description`,
  );
  const canonical = metaContent(
    head,
    /<link\s+rel="canonical"\s+href="([\s\S]*?)"\s*\/?>/,
    `${label} canonical`,
  );
  return { title, description, ogTitle, ogDescription, path: new URL(canonical).pathname };
}

function metadataLiteral(meta: PageMeta): string {
  return [
    "{",
    `  title: ${JSON.stringify(meta.title)},`,
    `  description: ${JSON.stringify(meta.description)},`,
    `  alternates: { canonical: ${JSON.stringify(meta.path)} },`,
    "  openGraph: {",
    '    type: "website",',
    `    url: ${JSON.stringify(meta.path)},`,
    `    title: ${JSON.stringify(meta.ogTitle)},`,
    `    description: ${JSON.stringify(meta.ogDescription)},`,
    "  },",
    '  twitter: { card: "summary" },',
    "}",
  ].join("\n");
}

function componentName(route: string): string {
  const parts = (route === "" ? "index" : route).split(/[^a-zA-Z0-9]+/);
  const joined = parts
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${joined || "Index"}Page`;
}

type SiteMigration = {
  label: string;
  pagesRoot: string;
  appRoot: string;
  extension: "tsx" | "mdx";
  extract: (html: string, label: string) => string;
};

/** Marketing pages: everything inside the authored `<main id="main">`. */
function websiteBody(html: string, label: string): string {
  const start = html.indexOf('<main id="main">');
  const end = html.lastIndexOf("</main>");
  if (start === -1 || end === -1) {
    throw new Error(`${label}: missing <main id="main">`);
  }
  return html.slice(start + '<main id="main">'.length, end);
}

/**
 * Docs pages: everything between the two chrome markers.
 *
 * The page keeps its own `<main>`, `<article>` and on-page `<nav class="toc">`,
 * so the DOM order stays sidebar, main, TOC exactly as the authored pages had
 * it; the layout supplies only the topbar, sidebar, footer and search dialog.
 */
function docsBody(html: string, label: string): string {
  const start = html.indexOf("<!-- docs:head -->");
  const end = html.indexOf("<!-- docs:foot -->");
  if (start === -1 || end === -1) {
    throw new Error(`${label}: missing chrome markers`);
  }
  const body = html.slice(start + "<!-- docs:head -->".length, end);
  if (!body.includes('<main class="content" id="main">') || !body.includes("</main>")) {
    throw new Error(`${label}: unexpected docs layout wrapper`);
  }
  return body;
}

const SITES: SiteMigration[] = [
  {
    label: "website",
    pagesRoot: join(repoRoot, "apps/website/src/pages"),
    appRoot: join(repoRoot, "apps/website/app"),
    extension: "tsx",
    extract: websiteBody,
  },
  {
    label: "docs",
    pagesRoot: join(repoRoot, "apps/docs/src/pages"),
    appRoot: join(repoRoot, "apps/docs/app"),
    extension: "mdx",
    extract: docsBody,
  },
];

async function htmlPages(root: string): Promise<{ absolute: string; route: string }[]> {
  const { readdir } = await import("node:fs/promises");
  const found: { absolute: string; route: string }[] = [];

  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.name === "index.html") {
        const route = relative(root, dirname(absolute)).replace(/^\.$/, "");
        found.push({ absolute, route });
      }
    }
  }

  await walk(root);
  found.sort((a, b) => a.route.localeCompare(b.route));
  return found;
}

type Result = { route: string; file: string; text: string };

async function migrateSite(site: SiteMigration): Promise<Result[]> {
  const results: Result[] = [];

  for (const page of await htmlPages(site.pagesRoot)) {
    const html = await readFile(page.absolute, "utf8");
    const head = /<head>([\s\S]*?)<\/head>/.exec(html);
    if (!head) {
      throw new Error(`${site.label} ${page.route}: missing head`);
    }
    const meta = readMeta(head[1], `${site.label} ${page.route}`);
    const body = convertFragment(site.extract(html, `${site.label} ${page.route}`), page.route).trim();
    const target = page.route === "" ? site.appRoot : join(site.appRoot, page.route);
    const file = join(target, `page.${site.extension}`);

    const text =
      site.extension === "tsx"
        ? [
            "// Migrated verbatim from the former authored HTML page body by",
            "// `npm run migrate:pages`. Header, main and footer come from app/layout.tsx.",
            'import type { Metadata } from "next";',
            "",
            `export const metadata: Metadata = ${metadataLiteral(meta)};`,
            "",
            `export default function ${componentName(page.route)}() {`,
            "  return (",
            "    <>",
            body,
            "    </>",
            "  );",
            "}",
            "",
          ].join("\n")
        : [`export const metadata = ${metadataLiteral(meta)};`, "", body, ""].join("\n");

    results.push({ route: page.route, file, text });
  }

  return results;
}

const dryRun = process.argv.includes("--dry");

for (const site of SITES) {
  for (const result of await migrateSite(site)) {
    if (dryRun) {
      console.log(`--- ${site.label} ${result.route || "/"} -> ${result.file}`);
      continue;
    }
    await mkdir(dirname(result.file), { recursive: true });
    await writeFile(result.file, result.text, "utf8");
    console.log(`${site.label}: wrote ${relative(repoRoot, result.file)}`);
  }
}
