import fs from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
import { createEmptySnapshot } from "./serialize";
import { sessionSnapshotSchema, SessionSnapshot } from "./types";

const LOCK_STALE_MS = 15_000;
// TODO: Add a per-path in-memory queue if same-process mutation contention becomes common.
const LOCK_MAX_ATTEMPTS = 30;
const LOCK_BACKOFF_MS = { min: 50, max: 500, factor: 1.5 } as const;

const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (isEnoent(error)) return false;
    throw error;
  }
};

const isEnoent = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";

export const readSnapshot = async (sessionPath: string): Promise<SessionSnapshot | null> => {
  let raw: string;
  try {
    raw = await fs.readFile(sessionPath, "utf8");
  } catch (error) {
    if (isEnoent(error)) return null;
    throw error;
  }
  if (!raw.trim()) {
    throw new Error(`Session snapshot is empty: ${sessionPath}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in session snapshot: ${sessionPath}`, {
      cause: error,
    });
  }

  const parsed = sessionSnapshotSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Invalid session snapshot schema at ${sessionPath}: ${parsed.error.message}`);
  }
  return parsed.data;
};

export const readSnapshotOrEmpty = async (sessionPath: string): Promise<SessionSnapshot> =>
  (await readSnapshot(sessionPath)) ?? createEmptySnapshot();

export const writeSnapshot = async (
  sessionPath: string,
  snapshot: SessionSnapshot,
): Promise<void> => {
  const dir = path.dirname(sessionPath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = `${sessionPath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, sessionPath);
};

/**
 * Exclusive writer critical section:
 * lock → read latest → apply mutation → atomic replace → unlock.
 *
 * Locks a stable sidecar (`*.lock`) so atomic rename of the snapshot
 * does not drop the inter-process exclusion.
 */
export const withLockedMutation = async (
  sessionPath: string,
  mutate: (prev: SessionSnapshot) => SessionSnapshot,
): Promise<SessionSnapshot> => {
  const dir = path.dirname(sessionPath);
  await fs.mkdir(dir, { recursive: true });

  if (!(await pathExists(sessionPath))) {
    await writeSnapshot(sessionPath, createEmptySnapshot());
  }

  const release = await lockfile.lock(sessionPath, {
    stale: LOCK_STALE_MS,
    realpath: false,
    retries: {
      retries: LOCK_MAX_ATTEMPTS - 1,
      minTimeout: LOCK_BACKOFF_MS.min,
      maxTimeout: LOCK_BACKOFF_MS.max,
      factor: LOCK_BACKOFF_MS.factor,
    },
  });
  try {
    const prev = await readSnapshotOrEmpty(sessionPath);
    const next = mutate(prev);
    await writeSnapshot(sessionPath, next);
    return next;
  } finally {
    await release();
  }
};
