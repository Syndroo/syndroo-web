// Entry-point wrapper so every script fails with one readable line instead of a
// stack trace, and always with a non-zero exit code.

export async function runCli(name: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${name}: ${message}`);
    process.exitCode = 1;
  }
}
