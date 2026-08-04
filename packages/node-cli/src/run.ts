import { commandUsage, findCommand, parseArgs, printJson } from "@msw-dev-tool/cli-core";
import { createCliContext, toCommandContext } from "./cli/context";

const usage = `msw-dev-tool — AI-oriented CLI for @msw-dev-tool/core Node sessions

This package is intended for AI agents to programmatically control msw-dev-tool
via one-shot commands. It reads/writes the session snapshot file; it does not
own the MSW SetupServer (the app that called setupDevToolServer does).

Session discovery (priority):
  1. --session <path>
  2. MSW_DEV_TOOL_SESSION
  3. .msw-dev-tool/session pointer in cwd

Commands:
${commandUsage()}

After changing mock handler code while the app is running, run \`msw-dev-tool reset\`
and wait for \`"pendingReset": false\` before running other commands. This refreshes
the session after a development-server/HMR reload.

Examples:
  msw-dev-tool list
  msw-dev-tool set-behavior '{"path":"/api","method":"get"}' delay
  msw-dev-tool add-temp --json '{"path":"/api/tmp","method":"get","contentType":"application/json","status":"200","response":"{\\"ok\\":true}"}'
`;

export const runCli = async (argv: string[]): Promise<void> => {
  const { flags, positionals } = parseArgs(argv);
  const commandName = positionals[0] ?? "help";

  if (commandName === "help" || flags.help) {
    process.stdout.write(`${usage}\n`);
    return;
  }

  const command = findCommand(commandName);
  if (!command) throw new Error(`Unknown command: ${commandName}\n\n${usage}`);

  const context = toCommandContext(createCliContext(flags));
  printJson(await command.execute(context, { flags, positionals }));
};
