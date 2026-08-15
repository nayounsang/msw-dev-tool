import type { ParsedArgs } from "./types";

const valueFlags = new Set(["json", "pid", "cdp-url", "target"]);

export const parseArgs = (argv: string[]): ParsedArgs => {
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const name = arg.slice(2);
    if (!valueFlags.has(name)) {
      flags[name] = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    flags[name] = value;
    index += 1;
  }

  return { flags, positionals };
};
