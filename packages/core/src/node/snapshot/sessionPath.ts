import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  SESSION_ENV_KEY,
  SESSION_POINTER_DIR,
  SESSION_POINTER_FILE,
} from "./types";

export const getSessionPointerPath = (cwd = process.cwd()) =>
  path.join(cwd, SESSION_POINTER_DIR, SESSION_POINTER_FILE);

export const resolveSessionPath = (cwd = process.cwd()): string | null => {
  const fromEnv = process.env[SESSION_ENV_KEY];
  if (fromEnv && fromEnv.trim()) {
    return path.resolve(fromEnv.trim());
  }

  const pointerPath = getSessionPointerPath(cwd);
  if (!fs.existsSync(pointerPath)) return null;

  const pointed = fs.readFileSync(pointerPath, "utf8").trim();
  if (!pointed) {
    throw new Error(`Session pointer is empty: ${pointerPath}`);
  }
  return path.resolve(pointed);
};

export const writeSessionPointer = (
  sessionPath: string,
  cwd = process.cwd()
) => {
  const dir = path.join(cwd, SESSION_POINTER_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getSessionPointerPath(cwd), `${sessionPath}\n`, "utf8");
};

export const createSessionFilePath = () => {
  const fileName = `msw-dev-tool-${process.pid}-${Math.random()
    .toString(36)
    .slice(2, 10)}.json`;
  return path.join(os.tmpdir(), fileName);
};

export const ensureSessionPath = (cwd = process.cwd()): string => {
  const existing = resolveSessionPath(cwd);
  if (existing) {
    const dir = path.dirname(existing);
    fs.mkdirSync(dir, { recursive: true });
    return existing;
  }

  const sessionPath = createSessionFilePath();
  writeSessionPointer(sessionPath, cwd);
  process.env[SESSION_ENV_KEY] = sessionPath;
  return sessionPath;
};

export const clearSessionArtifacts = (
  sessionPath: string,
  cwd = process.cwd()
) => {
  fs.rmSync(sessionPath, { force: true });
  fs.rmSync(`${sessionPath}.lock`, { force: true });

  const pointerPath = getSessionPointerPath(cwd);
  if (!fs.existsSync(pointerPath)) return;

  const pointed = fs.readFileSync(pointerPath, "utf8").trim();
  if (path.resolve(pointed) === path.resolve(sessionPath)) {
    fs.rmSync(pointerPath, { force: true });
  }
};
