// Builds one app into its own self-contained `dist/`:
//   * page HTML with the cross-site origins rewritten,
//   * the shared brand assets copied to `/assets/`,
//   * authored TypeScript compiled with Node's built-in type stripping.
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

export type AppBuild = {
  /** Workspace package name, used in build output. */
  name: string;
  appRoot: string;
  distRoot: string;
  pages: SourceCopy;
  copies: SourceCopy[];
  scripts: ScriptCompile[];
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
    const text = applyOrigins(await readFile(source, "utf8"), config.origins);
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

  for (const script of config.scripts) {
    const source = await readFile(script.from, "utf8");
    // Point the emitted `sourceURL` at the served path so generated browser code
    // never records a machine-specific source location.
    const sourceUrl = `/${toPosix(relative(config.distRoot, script.to))}`;
    const compiled = stripTypeScriptTypes(source, { mode: "strip", sourceUrl });
    await writeTextFile(script.to, compiled);
    files.push({
      path: toPosix(relative(config.distRoot, script.to)),
      bytes: Buffer.byteLength(compiled),
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
