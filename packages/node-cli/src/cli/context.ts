import fs from "node:fs";
import { getSessionPathForPid, listSessionPids } from "@msw-dev-tool/core/node/internal";
import { CliCommandContext } from "@msw-dev-tool/cli-core";
import { FileSnapshotCliSession } from "./session";

export type CliContext = {
  sessionPath: string;
  pid: number;
};

export const toCommandContext = ({ sessionPath, pid }: CliContext): CliCommandContext => ({
  session: new FileSnapshotCliSession(sessionPath),
  metadata: { sessionPath, pid },
});

export const createCliContext = (
  flags: Record<string, string | boolean>
): CliContext => {
  const fromFlag = flags.pid;
  if (typeof fromFlag === "string" && /^\d+$/.test(fromFlag)) {
    const pid = Number(fromFlag);
    const sessionPath = getSessionPathForPid(pid);
    if (!fs.existsSync(sessionPath)) {
      throw new Error(`No msw-dev-tool session found for PID ${pid} in this working directory.`);
    }
    return { pid, sessionPath };
  }
  if (fromFlag !== undefined) throw new Error("--pid must be a numeric process ID");

  const pids = listSessionPids();
  if (pids.length === 0) {
    throw new Error(
      "No msw-dev-tool sessions found. Start a Node process with setupDevToolServer() first."
    );
  }
  if (pids.length > 1) {
    throw new Error("Multiple msw-dev-tool sessions found. Run `msw-dev-tool sessions` and specify --pid <pid>.");
  }
  return { pid: pids[0]!, sessionPath: getSessionPathForPid(pids[0]!) };
};
