import fs from "node:fs";
import path from "node:path";
import { SESSION_DIR, SESSIONS_DIR } from "./types";

export const getSessionsDirectory = (cwd = process.cwd()) =>
  path.join(cwd, SESSION_DIR, SESSIONS_DIR);

export const getSessionPathForPid = (pid: number, cwd = process.cwd()) =>
  path.join(getSessionsDirectory(cwd), `${pid}.json`);

export const listSessionPids = (cwd = process.cwd()): number[] => {
  const dir = getSessionsDirectory(cwd);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((file) => /^([0-9]+)\.json$/.exec(file)?.[1])
    .filter((pid): pid is string => Boolean(pid))
    .map(Number)
    .sort((a, b) => a - b);
};

export const ensureSessionPath = (cwd = process.cwd(), pid = process.pid): string => {
  const sessionPath = getSessionPathForPid(pid, cwd);
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  return sessionPath;
};

export const clearSessionArtifacts = (sessionPath: string) => {
  fs.rmSync(sessionPath, { force: true });
  fs.rmSync(`${sessionPath}.lock`, { force: true });
};
