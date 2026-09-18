// Small filesystem helpers: walking, copying and the extension allowlist that
// both the build output and the local static servers are held to.
import { copyFile, lstat, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve, sep } from "node:path";

/**
 * Extensions a built site may contain and a local server may answer with.
 * Sources (`.ts`, `.md`, `.map`) and configuration files are deliberately absent.
 */
export const PUBLISHABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  ".avif",
  ".css",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".mjs",
  ".png",
  ".svg",
  ".txt",
  ".webp",
  ".woff",
  ".woff2",
  ".xml",
]);

export const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

/** Extensions the build audit reads as UTF-8 text. */
export const TEXT_EXTENSIONS: ReadonlySet<string> = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".mjs",
  ".svg",
  ".txt",
  ".xml",
]);

export function toPosix(path: string): string {
  return path.split(sep).join("/");
}

export function extensionOf(file: string): string {
  return extname(file).toLowerCase();
}

export function isPublishable(file: string): boolean {
  return PUBLISHABLE_EXTENSIONS.has(extensionOf(file));
}

/**
 * Names that are never build input or build output, even when their extension
 * would otherwise be publishable: hidden files, package manifests, lockfiles and
 * `tsconfig`/`jsconfig` variants.
 */
const IGNORED_NAMES: ReadonlySet<string> = new Set([
  ".env",
  "jsconfig.json",
  "npm-shrinkwrap.json",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
]);

export function isIgnoredName(file: string): boolean {
  const name = basename(file);
  if (name.startsWith(".")) {
    return true;
  }
  if (IGNORED_NAMES.has(name.toLowerCase())) {
    return true;
  }
  return /^(?:tsconfig|jsconfig)\..+\.json$/i.test(name);
}

export type ListFilesOptions = {
  /** Include dot-files and dot-directories. The build never does; the audit does. */
  includeHidden?: boolean;
  /** Include symlinks so a caller can report them instead of following them. */
  includeSymlinks?: boolean;
};

/**
 * Every regular file under `root`, sorted.
 *
 * Returns an empty list when the root is missing or is itself a symlink: a
 * symlinked root is never traversed, because following it would silently widen
 * the tree a build reads from or a server exposes. Symlinked entries and hidden
 * trees are skipped unless a caller asks for them.
 */
export async function listFiles(root: string, options: ListFilesOptions = {}): Promise<string[]> {
  const includeHidden = options.includeHidden ?? false;
  const includeSymlinks = options.includeSymlinks ?? false;
  const found: string[] = [];

  try {
    if ((await lstat(root)).isSymbolicLink()) {
      return [];
    }
  } catch {
    return [];
  }

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }
      throw error;
    }

    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.name.startsWith(".") && !includeHidden) {
        continue;
      }
      if (entry.isSymbolicLink()) {
        if (includeSymlinks) {
          found.push(full);
        }
        // Symlinked inputs are skipped rather than followed, so a link cannot
        // pull a file from outside the source tree into a build.
        continue;
      }
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        found.push(full);
      }
    }
  }

  await walk(root);
  return found.sort();
}

/** Remove a generated output directory. Refuses filesystem roots. */
export async function resetDirectory(dir: string): Promise<void> {
  const target = resolve(dir);
  if (target === resolve("/") || dirname(target) === target) {
    throw new Error(`refusing to remove ${target}`);
  }
  await rm(target, { recursive: true, force: true });
}

export async function writeTextFile(file: string, text: string): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text, "utf8");
}

export async function copyFileEnsured(from: string, to: string): Promise<void> {
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
}
