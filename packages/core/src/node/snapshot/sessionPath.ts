import fs from "node:fs/promises";
import path from "node:path";
import { SESSION_DIR, SESSIONS_DIR } from "./types";

const isEnoent = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";

export const getSessionsDirectory = (cwd = process.cwd()) =>
  path.join(cwd, SESSION_DIR, SESSIONS_DIR);

export const getSessionPathForPid = (pid: number, cwd = process.cwd()) =>
  path.join(getSessionsDirectory(cwd), `${pid}.json`);

export const listSessionPids = async (cwd = process.cwd()): Promise<number[]> => {
  try {
    const files = await fs.readdir(getSessionsDirectory(cwd));
    return files
      .map((file) => /^([0-9]+)\.json$/.exec(file)?.[1])
      .filter((pid): pid is string => Boolean(pid))
      .map(Number)
      .sort((a, b) => a - b);
  } catch (error) {
    if (isEnoent(error)) return [];
    throw error;
  }
};

export const ensureSessionPath = async (
  cwd = process.cwd(),
  pid = process.pid
): Promise<string> => {
  const sessionPath = getSessionPathForPid(pid, cwd);
  await fs.mkdir(path.dirname(sessionPath), { recursive: true });
  return sessionPath;
};

export const clearSessionArtifacts = async (sessionPath: string): Promise<void> => {
  await fs.rm(sessionPath, { force: true });
  await fs.rm(`${sessionPath}.lock`, { force: true });
};
