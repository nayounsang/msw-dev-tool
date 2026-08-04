import { commandUsage, findCommand, parseArgs, printJson } from "@msw-dev-tool/cli-core";
import { CdpClient, listTargets } from "./cdp";
import { CdpBrowserCliSession } from "./session";

const usage = `msw-dev-tool-browser — AI-oriented CLI for @msw-dev-tool/core browser sessions\n\nCommands:\n  tabs\n${commandUsage()}\n\nAll commands except tabs require --cdp-url <http-url> and --target <target-id>.`;
const requiredFlag = (flags: Record<string, string | boolean>, name: string) => {
  const value = flags[name];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing required --${name}`);
  return value;
};

export const runCli = async (argv: string[]): Promise<void> => {
  const args = parseArgs(argv);
  const commandName = args.positionals[0] ?? "help";
  if (commandName === "help" || args.flags.help) { process.stdout.write(`${usage}\n`); return; }
  const cdpUrl = requiredFlag(args.flags, "cdp-url");
  const targets = await listTargets(cdpUrl);
  if (commandName === "tabs") {
    printJson({ ok: true, cdpUrl, targets: targets.filter((target) => target.type === "page").map(({ id, title, url }) => ({ id, title, url })) });
    return;
  }
  const targetId = requiredFlag(args.flags, "target");
  const target = targets.find((candidate) => candidate.id === targetId && candidate.type === "page");
  if (!target?.webSocketDebuggerUrl) throw new Error(`No page target found for id: ${targetId}`);
  const command = findCommand(commandName);
  if (!command) throw new Error(`Unknown command: ${commandName}\n\n${usage}`);
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  try {
    printJson(await command.execute({ session: new CdpBrowserCliSession(client), metadata: { cdpUrl, targetId, url: target.url } }, args));
  } finally { client.close(); }
};
