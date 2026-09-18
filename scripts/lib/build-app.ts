// Builds one app into its own self-contained `dist/`:
//   * page HTML with the cross-site origins rewritten,
//   * the shared brand assets copied to `/assets/`,
//   * authored TypeScript compiled with Node's built-in type stripping,
//   * generated files such as a sitemap, rendered from the configured origins.
//
// Type stripping is not a type check: it removes annotations and fails only on
// syntax that cannot be erased. Nothing outside the extension allowlist is ever
// written, so sources, Markdown, maps and provenance stay out of the output.
import { stripTypeScriptTypes } from "node:module";
import { readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { applyOrigins, type Origins } from "./origins.ts";
import {
  copyFileEnsured,
  extensionOf,
  isIgnoredName,
  isPublishable,
  listFiles,
  resetDirectory,
  toPosix,
  writeTextFile,
} from "./files.ts";

/** Copy a source directory into a `dist`-relative directory. */
export type SourceCopy = {
  from: string;
  to: string;
};

/** Compile one TypeScript source to one `dist`-relative file. */
export type ScriptCompile = {
  from: string;
  to: string;
};

/** Generate one text file from the configured origins, such as a sitemap. */
export type GeneratedFile = {
  to: string;
  render: (origins: Origins) => string;
};

/**
 * Rewrite one authored page before the origins are applied. Used for the
 * documentation chrome so fifteen pages share one navigation module. It is not
 * a template engine: pages stay authored HTML and the hook only fills the two
 * markers a page declares.
 */
export type PageTransform = (relativePath: string, text: string) => string;

export type AppBuild = {
  /** Workspace package name, used in build output. */
  name: string;
  appRoot: string;
  distRoot: string;
  pages: SourceCopy;
  copies: SourceCopy[];
  scripts: ScriptCompile[];
  generated?: GeneratedFile[];
  transformPage?: PageTransform;
  origins: Origins;
  /** Pages that must exist after a build, as `dist`-relative paths. */
  expectedPages: string[];
};

export type BuiltFile = {
  path: string;
  bytes: number;
};

export type BuildResult = {
  name: string;
  distRoot: string;
  pages: string[];
  files: BuiltFile[];
};

export async function buildApp(config: AppBuild): Promise<BuildResult> {
  await resetDirectory(config.distRoot);

  const files: BuiltFile[] = [];
  const pages: string[] = [];

  for (const source of await listFiles(config.pages.from)) {
    if (extensionOf(source) !== ".html" || isIgnoredName(source)) {
      continue;
    }
    const rel = toPosix(relative(config.pages.from, source));
    const target = join(config.distRoot, config.pages.to, rel);
    const authored = await readFile(source, "utf8");
    // The page transform runs before origin rewriting so injected cross-site
    // links carry the placeholder origins and are rewritten like any other.
    const expanded = config.transformPage ? config.transformPage(rel, authored) : authored;
    const text = applyOrigins(expanded, config.origins);
    await writeTextFile(target, text);
    files.push({ path: toPosix(join(config.pages.to, rel)), bytes: Buffer.byteLength(text) });
    pages.push(toPosix(join(config.pages.to, rel)));
  }

  for (const rule of config.copies) {
    for (const source of await listFiles(rule.from)) {
      // Only publishable asset files are copied: sources, Markdown, provenance
      // notes and configuration files such as `package.json` never reach a build.
      if (!isPublishable(source) || isIgnoredName(source)) {
        continue;
      }
      const rel = toPosix(relative(rule.from, source));
      const target = join(config.distRoot, rule.to, rel);
      await copyFileEnsured(source, target);
      files.push({ path: toPosix(join(rule.to, rel)), bytes: (await stat(target)).size });
    }
  }

  for (const generated of config.generated ?? []) {
    const text = generated.render(config.origins);
    await writeTextFile(generated.to, text);
    files.push({
      path: toPosix(relative(config.distRoot, generated.to)),
      bytes: Buffer.byteLength(text),
    });
  }

  for (const script of config.scripts) {
    const source = await readFile(script.from, "utf8");
    // Point the emitted `sourceURL` at the served path so generated browser code
    // never records a machine-specific source location.
    const sourceUrl = `/${toPosix(relative(config.distRoot, script.to))}`;
    const compiled = stripTypeScriptTypes(source, { mode: "strip", sourceUrl });
    // Shared content modules carry the placeholder origins inside string
    // literals, so the same single-pass rewrite applies to generated browser
    // code. Without it a custom-origin build would ship loopback links in its
    // own bundle, and the build audit would report them.
    const text = applyOrigins(compiled, config.origins);
    await writeTextFile(script.to, text);
    files.push({
      path: toPosix(relative(config.distRoot, script.to)),
      bytes: Buffer.byteLength(text),
    });
  }

  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  pages.sort();

  return { name: config.name, distRoot: config.distRoot, pages, files };
}

export function describeBuild(result: BuildResult): string[] {
  const lines = [
    `${result.name}: ${result.pages.length} page(s), ${result.files.length} file(s) -> ${result.distRoot}`,
  ];
  for (const file of result.files) {
    lines.push(`  ${file.path} (${file.bytes} bytes)`);
  }
  return lines;
}

/** Build and print the artifact list, used by every build entry point. */
export async function runAppBuild(config: AppBuild): Promise<BuildResult> {
  const result = await buildApp(config);
  for (const line of describeBuild(result)) {
    console.log(line);
  }
  return result;
}
