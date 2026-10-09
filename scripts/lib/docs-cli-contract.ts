// Cross-check the CLI surface the documentation introduces against the CLI's
// own help output.
//
// The accepted surface is the three first-level commands `connect`, `publish`
// and `status` plus the global flags `--config`, `--json`, `--verbose`,
// `--no-color`, `--help` and `--version` (decision Q13 / architecture-v1
// section 12.1). It is declared once in `packages/content/site-data.ts` as
// `cliSurface` and mirrored here as the audit's input.
//
// Two things are checked, and neither is a rubber stamp:
//
//   1. the built documentation is read as text. A `syndroo` invocation or an
//      inline `--flag` claim that is not on the accepted surface fails, and any
//      retired command family fails even when it is only prose;
//   2. when a product checkout is reachable, the real CLI is run with `--help`
//      for every accepted command plus `--version`, and every accepted command
//      and flag must appear there. Drift between the shipped CLI and the
//      documented surface fails the check instead of passing quietly.
//
// The check never executes a documented example: it runs help and version only,
// so no account is touched and no content is sent.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { cliSurface } from "../../packages/content/site-data.ts";

const run = promisify(execFile);

/** The accepted first-level commands, in the documented order. */
export const ACCEPTED_COMMANDS: readonly string[] = cliSurface.commands.map(
  (command) => command.name,
);

/** The accepted global flags. They are valid with every command. */
export const ACCEPTED_GLOBAL_FLAGS: readonly string[] = [...cliSurface.globalFlags];

/**
 * Command words the v1 documentation must never print again. The architecture
 * abandons the earlier command surface outright (decision Q25), so a leftover
 * example is a defect rather than a compatibility question.
 */
export const RETIRED_COMMANDS: readonly string[] = [
  "doctor",
  "posts",
  "skill",
  "local",
  "init",
  "auth",
  "providers",
  "receipts",
  "state",
  "help",
];

/** Every flag the accepted surface allows, per command. */
export function documentedFlagsFor(command: string): readonly string[] {
  return cliSurface.commands.find((entry) => entry.name === command)?.flags ?? [];
}

/** The union of every flag the accepted surface allows. */
export function allDocumentedFlags(): readonly string[] {
  return [
    ...ACCEPTED_GLOBAL_FLAGS,
    ...cliSurface.commands.flatMap((command) => [...command.flags]),
  ];
}

export type CliInvocation = {
  /** Normalised command, for example `publish`. */
  command: string;
  /** Flags written on the same line, in the order they appear. */
  flags: string[];
  /** Path of the page the invocation was read from. */
  page: string;
};

export type CliSurface = {
  invocations: CliInvocation[];
  /** Flags written as a standalone inline code span, such as `--json`. */
  inlineFlags: { flag: string; page: string }[];
  /** Retired command words that still appear in the rendered page text. */
  retired: { command: string; page: string }[];
};

const FLAG_PATTERN = /(?<![\w-])--[a-z][a-z0-9-]*/g;
const UNIT_FLAG = /^--[a-z][a-z0-9-]*$/;
/**
 * An inline code span that documents a flag together with its argument, such as
 * `--config <path>` or `--limit <count>`. Only the leading flag is read: the
 * rest of the span is the argument shape, not another flag.
 */
const INLINE_FLAG_USAGE = /^(--[a-z][a-z0-9-]*)\s+\S+/;
/** The forms the documentation is allowed to use to start the command. */
const INVOCATION_LINE = /^(?:npx\s+|\.\/node_modules\/\.bin\/)?syndroo\s+(.+)$/;
/** A retired command word after the product name, anywhere in the page text. */
const RETIRED_IN_TEXT = new RegExp(`\\bsyndroo\\s+(${RETIRED_COMMANDS.join("|")})\\b`, "g");

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
 * Read one shell line. The command word is the first plain lowercase word after
 * the product name; everything from the first flag, quote, variable or path is
 * not part of the command.
 */
function parseInvocation(line: string): { command: string; flags: string[] } | null {
  const match = INVOCATION_LINE.exec(line);
  if (match === null) {
    return null;
  }

  const word = /^([a-z][a-z-]*)/.exec(match[1] as string)?.[1];
  if (word === undefined) {
    return null;
  }

  return { command: word, flags: [...line.matchAll(FLAG_PATTERN)].map((flag) => flag[0]) };
}

export function extractCliSurface(pages: { path: string; html: string }[]): CliSurface {
  const invocations: CliInvocation[] = [];
  const inlineFlags: { flag: string; page: string }[] = [];
  const retired: { command: string; page: string }[] = [];

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
      const span = body.trim();

      // A whole command may also appear in prose, so a code span is read as an
      // invocation when it starts with the product name.
      const inline = parseInvocation(span);
      if (inline !== null) {
        invocations.push({ command: inline.command, flags: inline.flags, page: page.path });
        continue;
      }

      // A span is a claim about a flag when it is the flag alone (`--json`) or
      // the flag followed by its argument shape (`--limit <count>`).
      const named = UNIT_FLAG.test(span) ? span : INLINE_FLAG_USAGE.exec(span)?.[1];
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

    // Retired families are refused even when they appear as plain prose, so a
    // removed command cannot survive in a sentence the code-span reader skips.
    // A page may name a retired command only inside a clearly labelled
    // historical note; none of the current pages does.
    for (const match of pageText.matchAll(RETIRED_IN_TEXT)) {
      retired.push({ command: match[1] as string, page: page.path });
    }
  }

  return { invocations, inlineFlags, retired };
}

/**
 * Run one `--help` invocation against the real CLI.
 */
async function helpFor(cliBin: string, command: string): Promise<{ ok: boolean; text: string }> {
  const words = command.split(" ");

  for (const args of [
    [...words, "--help"],
    [...words, "post_placeholder", "--help"],
  ]) {
    try {
      const { stdout, stderr } = await run(process.execPath, [cliBin, ...args]);
      return { ok: true, text: `${stdout}\n${stderr}` };
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string };
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
  const invocations = surface.invocations;

  if (invocations.length === 0) {
    return ["no documented syndroo invocation was found in the built documentation"];
  }

  // 1. The documented surface, read as text.
  for (const entry of surface.retired) {
    issues.push(
      `${entry.page} still prints the retired command "syndroo ${entry.command}", which architecture v1 does not ship`,
    );
  }

  const accepted = new Set(ACCEPTED_COMMANDS);
  const global = new Set(ACCEPTED_GLOBAL_FLAGS);

  for (const invocation of invocations) {
    if (!accepted.has(invocation.command)) {
      issues.push(
        `${invocation.page} documents "syndroo ${invocation.command}", which is not one of the three accepted commands`,
      );
      continue;
    }

    const allowed = new Set([...global, ...documentedFlagsFor(invocation.command)]);
    for (const flag of invocation.flags) {
      if (!allowed.has(flag)) {
        issues.push(
          `${invocation.page} documents "${flag}" on "syndroo ${invocation.command}", which the accepted surface does not list`,
        );
      }
    }
  }

  const allFlags = new Set(allDocumentedFlags());
  for (const { flag, page } of surface.inlineFlags) {
    if (!allFlags.has(flag)) {
      issues.push(`${page} documents "${flag}", which the accepted surface does not list`);
    }
  }

  // 2. The real CLI, when the product checkout is reachable.
  const helpByCommand = new Map<string, string>();

  for (const command of ACCEPTED_COMMANDS) {
    const help = await helpFor(options.cliBin, command);
    helpByCommand.set(command, help.text);

    if (!help.ok) {
      issues.push(`the CLI does not accept the accepted command "syndroo ${command}"`);
    }
  }

  // The static mirror must match the shipped help output: a new flag that never
  // reaches this list is drift, and so is a documented flag the CLI dropped.
  for (const command of cliSurface.commands) {
    const help = helpByCommand.get(command.name) ?? "";
    for (const flag of command.flags) {
      if (!help.includes(flag)) {
        issues.push(`the accepted surface lists "${flag}" for "syndroo ${command.name}", but the CLI help does not`);
      }
    }
  }

  const allHelp = [...helpByCommand.values()].join("\n");
  const acceptedCommandsHelp = `${allHelp}\n${await rootHelp(options.cliBin)}`;
  for (const command of ACCEPTED_COMMANDS) {
    if (!acceptedCommandsHelp.includes(command)) {
      issues.push(`the CLI help never mentions the accepted command "${command}"`);
    }
  }

  // The global flags are read before Commander sees the line, so they never
  // appear in any command's option list. Each one is probed instead: accepted
  // with `--help`, and refused as an unknown option when it is not.
  const globalFlagProblems = new Map<string, string>();
  for (const flag of ACCEPTED_GLOBAL_FLAGS) {
    const problem = await probeGlobalFlag(options.cliBin, flag);
    if (problem !== undefined) {
      globalFlagProblems.set(flag, problem);
      issues.push(`the accepted global flag "${flag}" is not accepted by the CLI: ${problem}`);
    }
  }

  for (const invocation of invocations) {
    const help = helpByCommand.get(invocation.command) ?? "";
    for (const flag of invocation.flags) {
      const isGlobal = ACCEPTED_GLOBAL_FLAGS.includes(flag) && !globalFlagProblems.has(flag);
      if (!help.includes(flag) && !isGlobal) {
        issues.push(
          `${invocation.page} documents "${flag}" on "syndroo ${invocation.command}", but that command's help does not accept it`,
        );
      }
    }
  }

  for (const { flag, page } of surface.inlineFlags) {
    const isGlobal = ACCEPTED_GLOBAL_FLAGS.includes(flag) && !globalFlagProblems.has(flag);

    if (!allHelp.includes(flag) && !isGlobal) {
      issues.push(`${page} documents "${flag}", which the CLI does not accept`);
    }
  }

  try {
    const { stdout } = await run(process.execPath, [options.cliBin, "--version"]);
    if (!stdout.includes(options.expectedVersion)) {
      issues.push(
        `the CLI reports "${stdout.trim()}", which does not match the documented candidate ${options.expectedVersion}`,
      );
    }
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    issues.push(`the CLI did not answer "--version": ${(failure.stderr ?? "").trim()}`);
  }

  return issues;
}

/** The root help page, used only to prove the command list is advertised. */
async function rootHelp(cliBin: string): Promise<string> {
  try {
    const { stdout, stderr } = await run(process.execPath, [cliBin, "--help"]);
    return `${stdout}\n${stderr}`;
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    return `${failure.stdout ?? ""}\n${failure.stderr ?? ""}`;
  }
}

/**
 * Probe one global flag without side effects.
 *
 * `--help` is already handled before any command runs, and the configuration is
 * loaded lazily, so `syndroo <global> --help` prints usage and exits 0 without
 * reading configuration, state or a credential. An unknown option is refused by
 * Commander and never reaches the help output.
 */
async function probeGlobalFlag(cliBin: string, flag: string): Promise<string | undefined> {
  if (flag === "--version") {
    try {
      const { stdout } = await run(process.execPath, [cliBin, "--version"]);
      return /^\d+\.\d+\.\d+/.test(stdout.trim()) ? undefined : `unexpected output ${JSON.stringify(stdout.trim())}`;
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string };
      return `exit was not 0 (${(failure.stderr ?? "").trim()})`;
    }
  }

  const args =
    flag === "--config"
      ? [cliBin, "--config", "/nonexistent/syndroo-docs-flag-probe.json", "--help"]
      : [cliBin, flag, "--help"];

  try {
    const { stdout, stderr } = await run(process.execPath, args);
    return `${stdout}${stderr}`.includes("Usage: syndroo")
      ? undefined
      : `the help text did not come back for ${flag}`;
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    return `exit was not 0 (${(failure.stderr ?? "").trim()})`;
  }
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
