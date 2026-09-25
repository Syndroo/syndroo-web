// Cross-check the CLI surface the documentation introduces against the CLI's
// own help output.
//
// The command itself lives in the product repository, so this module reads the
// real `--help` text when a checkout is reachable and reports every documented
// command or flag that does not exist. A documented option that no longer ships
// has to fail a check rather than reach a reader.
//
// The check never executes a documented example: it runs `--help` for each
// command the pages show, plus `version`, and nothing else. Examples are read as
// text, so a page can show a post document or a `--yes` run without this
// repository ever touching an account.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Commands whose first word is a group rather than the whole command. */
const GROUP_WORDS: ReadonlySet<string> = new Set([
  "auth",
  "posts",
  "providers",
  "receipts",
  "skill",
  "state",
]);

const FLAG_PATTERN = /(?<![\w-])--[a-z][a-z0-9-]*/g;
const UNIT_FLAG = /^--[a-z][a-z0-9-]*$/;
/**
 * An inline code span that documents a flag together with its argument, such as
 * `--timeout <duration>` or `--limit <n>`. Only the leading flag is read: the
 * rest of the span is the argument shape, not another flag.
 */
const INLINE_FLAG_USAGE = /^(--[a-z][a-z0-9-]*)\s+\S+/;
const COMMAND_WORD = /^[a-z][a-z-]*$/;
/** The forms the documentation is allowed to use to start the command. */
const INVOCATION_LINE = /^(?:npx\s+|\.\/node_modules\/\.bin\/)?syndroo\s+(.+)$/;

export type CliInvocation = {
  /** Normalised command, for example `posts create`. */
  command: string;
  /** Flags written on the same line, in the order they appear. */
  flags: string[];
  /** Path of the page the invocation was read from. */
  page: string;
};

export type CliSurface = {
  invocations: CliInvocation[];
  /** Flags written as a standalone inline code span, such as `--yes`. */
  inlineFlags: { flag: string; page: string }[];
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Rendered page text without the RSC payload and stylesheet sources. */
function withoutScripts(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, "");
}

function codeBlockBodies(html: string): string[] {
  const bodies: string[] = [];
  for (const match of withoutScripts(html).matchAll(/<pre\b[^>]*>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g)) {
    bodies.push(decodeEntities(match[1] as string));
  }
  return bodies;
}

function inlineCodeBodies(html: string): string[] {
  // Inline code spans only: any `<code>` that is not the child of a `<pre>`.
  return withoutScripts(html)
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/g, "")
    .split(/<\/code>/)
    .map((chunk) => {
      const start = chunk.lastIndexOf("<code>");
      return start === -1 ? "" : decodeEntities(chunk.slice(start + "<code>".length));
    })
    .filter((body) => body !== "");
}

/**
 * Read one shell line. The command words are the leading run of plain lowercase
 * words; everything from the first flag, quote, variable or path is ignored.
 */
function parseInvocation(line: string): { command: string; flags: string[] } | null {
  const match = INVOCATION_LINE.exec(line);
  if (match === null) {
    return null;
  }

  const tokens = (match[1] as string).split(/\s+/).filter((token) => token !== "");
  const words: string[] = [];

  for (const token of tokens) {
    if (token.startsWith("-") || !COMMAND_WORD.test(token)) {
      break;
    }
    words.push(token);
  }

  if (words.length === 0) {
    return null;
  }

  const command = GROUP_WORDS.has(words[0] as string)
    ? words.slice(0, 2).join(" ")
    : (words[0] as string);

  return { command, flags: [...line.matchAll(FLAG_PATTERN)].map((flag) => flag[0]) };
}

export function extractCliSurface(pages: { path: string; html: string }[]): CliSurface {
  const invocations: CliInvocation[] = [];
  const inlineFlags: { flag: string; page: string }[] = [];

  for (const page of pages) {
    for (const block of codeBlockBodies(page.html)) {
      for (const line of block.split("\n")) {
        const parsed = parseInvocation(line.trim());
        if (parsed !== null) {
          invocations.push({ command: parsed.command, flags: parsed.flags, page: page.path });
        }
      }
    }

    const pageText = decodeEntities(withoutScripts(page.html));

    for (const body of inlineCodeBodies(page.html)) {
      const flag = body.trim();

      // Inline code may also carry a whole command, as it does inside the agent
      // instruction block, so a command in prose is checked as well.
      const inline = parseInvocation(flag);
      if (inline !== null) {
        invocations.push({ command: inline.command, flags: inline.flags, page: page.path });
        continue;
      }

      // A span is a claim about a flag when it is the flag alone (`--yes`) or
      // the flag followed by its argument shape (`--timeout <duration>`).
      const named = UNIT_FLAG.test(flag) ? flag : INLINE_FLAG_USAGE.exec(flag)?.[1];
      if (named === undefined) {
        continue;
      }
      // "there is no `--api-key` flag" is a statement about an option the CLI
      // deliberately does not have, not a claim that it does.
      if (isNegated(pageText, named)) {
        continue;
      }
      inlineFlags.push({ flag: named, page: page.path });
    }
  }

  return { invocations, inlineFlags };
}

/**
 * Run one `--help` invocation against the real CLI.
 *
 * `mode` carries the local selector when a page spells one, so `doctor --local`
 * is checked against the local help output rather than the remote one.
 */
async function helpFor(
  cliBin: string,
  command: string,
  mode: string[] = [],
): Promise<{ ok: boolean; text: string }> {
  const words = command.split(" ");

  for (const args of [
    [...words, ...mode, "--help"],
    [...words, "post_placeholder", ...mode, "--help"],
  ]) {
    try {
      const { stdout, stderr } = await run(process.execPath, [cliBin, ...args]);
      return { ok: true, text: `${stdout}\n${stderr}` };
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string; code?: number };
      const text = `${failure.stdout ?? ""}\n${failure.stderr ?? ""}`;
      // A command with a required positional reports the missing argument
      // before it prints help, so retry once with the placeholder in place.
      if (!/expects \d+ argument/.test(text)) {
        return { ok: false, text };
      }
    }
  }

  return { ok: false, text: `${command} did not answer --help` };
}

export type CliContractOptions = {
  /** Absolute path of the CLI entry point in a product checkout. */
  cliBin: string;
  pages: { path: string; html: string }[];
  /** Candidate version the documentation claims for the CLI. */
  expectedVersion: string;
};

/**
 * Returns one message per problem. An empty array means the documented surface
 * is exactly a subset of what the CLI accepts.
 */
export async function checkCliContract(options: CliContractOptions): Promise<string[]> {
  const issues: string[] = [];
  const surface = extractCliSurface(options.pages);
  const commands = [...new Set(surface.invocations.map((entry) => entry.command))].sort();

  if (commands.length === 0) {
    return ["no documented syndroo invocation was found in the built documentation"];
  }

  // The local selector changes which mode the command answers help for, so a
  // command documented with `--local` is checked against that mode. Every
  // current `doctor` example is local, and the flag would otherwise be checked
  // against the wrong help text.
  const localModeByCommand = new Map<string, string[]>();
  for (const invocation of surface.invocations) {
    if (invocation.flags.includes("--local")) {
      localModeByCommand.set(invocation.command, ["--local"]);
    }
  }

  const helpByCommand = new Map<string, string>();
  const localHelpByCommand = new Map<string, string>();

  for (const command of commands) {
    const help = await helpFor(options.cliBin, command);
    helpByCommand.set(command, help.text);
    if (!help.ok) {
      issues.push(`the documentation uses "syndroo ${command}", which the CLI does not accept`);
    }

    const mode = localModeByCommand.get(command);
    if (mode !== undefined) {
      localHelpByCommand.set(command, (await helpFor(options.cliBin, command, mode)).text);
    }
  }

  for (const invocation of surface.invocations) {
    // A flag written next to `--local` is checked against the local help, so a
    // local-only flag cannot be excused by the remote invocation's options.
    const help = invocation.flags.includes("--local")
      ? (localHelpByCommand.get(invocation.command) ?? helpByCommand.get(invocation.command) ?? "")
      : (helpByCommand.get(invocation.command) ?? "");
    for (const flag of invocation.flags) {
      if (!help.includes(flag)) {
        issues.push(
          `${invocation.page} documents "${flag}" on "syndroo ${invocation.command}", but that command's help does not accept it`,
        );
      }
    }
  }

  const allHelp = [...helpByCommand.values(), ...localHelpByCommand.values()].join("\n");
  for (const { flag, page } of surface.inlineFlags) {
    if (!allHelp.includes(flag)) {
      issues.push(`${page} documents "${flag}", which no command in the CLI help accepts`);
    }
  }

  try {
    const { stdout } = await run(process.execPath, [options.cliBin, "version"]);
    if (!stdout.includes(options.expectedVersion)) {
      issues.push(
        `the CLI reports "${stdout.trim()}", which does not match the documented candidate ${options.expectedVersion}`,
      );
    }
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    issues.push(`the CLI did not answer "version": ${(failure.stderr ?? "").trim()}`);
  }

  return issues;
}

/** Where a product checkout is expected to be, resolved from the environment. */
export function resolveCliBin(coreRepo: string): string {
  return process.env.SYNDROO_CLI_BIN ?? `${coreRepo}/packages/cli/dist/bin.js`;
}

/**
 * A flag written after a negation is a statement about an option the CLI does
 * not have, so it is not a claim this checker should enforce.
 */
function isNegated(pageText: string, flag: string): boolean {
  const at = pageText.indexOf(flag);
  if (at === -1) {
    return false;
  }
  const before = pageText.slice(Math.max(0, at - 48), at);
  return /\b(no|not|never|without)\b/i.test(before);
}
