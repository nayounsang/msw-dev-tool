import { commandUsage, findCommand, parseArgs, printJson } from "@msw-dev-tool/cli-core";
import { createCliContext, toCommandContext } from "./cli/context";
import { listSessionPids } from "@msw-dev-tool/core/node/internal";

const usage = `msw-dev-tool — AI-oriented CLI for @msw-dev-tool/core Node sessions

This package is intended for AI agents to programmatically control msw-dev-tool
via one-shot commands. It reads/writes the session snapshot file; it does not
own the MSW SetupServer (the app that called setupDevToolServer does).

Session discovery:
  msw-dev-tool sessions            List PID-based sessions in this cwd
  msw-dev-tool --pid <pid> <command>
  When exactly one session exists, commands select it automatically.

Commands:
${commandUsage()}

After changing mock handler code while the app is running, run \`msw-dev-tool reset\`
and wait for \`"pendingReset": false\` before running other commands. This refreshes
the session after a development-server/HMR reload.

Examples:
  msw-dev-tool list
  msw-dev-tool set-behavior '{"path":"/api","method":"get"}' delay
  msw-dev-tool set-custom-response '{"path":"/api","method":"get"}' --json '{"status":"201","contentType":"application/json","response":"{\\"created\\":true}","delay":100}'
  msw-dev-tool add-temp --json '{"path":"/api/tmp","method":"get","contentType":"application/json","status":"200","response":"{\\"ok\\":true}"}'

set-custom-response stores response data only. Run set-behavior <id> "custom response"
to apply it.
`;

export const runCli = async (argv: string[]): Promise<void> => {
  const { flags, positionals } = parseArgs(argv);
  const commandName = positionals[0] ?? "help";

  if (commandName === "help" || flags.help) {
    process.stdout.write(`${usage}\n`);
    return;
  }

  if (commandName === "sessions") {
    printJson({ ok: true, sessions: (await listSessionPids()).map((pid) => ({ pid })) });
    return;
  }

  const command = findCommand(commandName);
  if (!command) throw new Error(`Unknown command: ${commandName}\n\n${usage}`);

  const context = toCommandContext(await createCliContext(flags));
  printJson(await command.execute(context, { flags, positionals }));
};
