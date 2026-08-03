export type ParsedArgs = {
  flags: Record<string, string | boolean>;
  positionals: string[];
};

export const parseArgs = (argv: string[]): ParsedArgs => {
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json" || arg === "--session") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      flags[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      flags[arg.slice(2)] = true;
      continue;
    }
    positionals.push(arg);
  }

  return { flags, positionals };
};
