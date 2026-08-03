import { SESSION_ENV_KEY, resolveSessionPath } from "@msw-dev-tool/core/node/internal";

export type CliContext = {
  sessionPath: string;
};

export const createCliContext = (
  flags: Record<string, string | boolean>
): CliContext => {
  const fromFlag = flags.session;
  if (typeof fromFlag === "string" && fromFlag.trim()) {
    return { sessionPath: fromFlag.trim() };
  }

  const sessionPath = resolveSessionPath();
  if (!sessionPath) {
    throw new Error(
      `No msw-dev-tool session found. Start a Node process with setupDevToolServer() first, or pass --session <path> / set ${SESSION_ENV_KEY}.`
    );
  }
  return { sessionPath };
};
