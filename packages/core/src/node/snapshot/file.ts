import fs from "node:fs";
import path from "node:path";
import lockfile from "proper-lockfile";
import { createEmptySnapshot } from "./serialize";
import { sessionSnapshotSchema, SessionSnapshot } from "./types";

const LOCK_STALE_MS = 15_000;
const LOCK_MAX_ATTEMPTS = 10;
const LOCK_BACKOFF_MS = { min: 50, max: 500, factor: 1.5 } as const;

const sleepSync = (ms: number) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const acquireLockSync = (sessionPath: string): (() => void) => {
  let lastError: unknown;
  for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt += 1) {
    try {
      // retries are async-only in proper-lockfile; backoff here for lockSync.
      return lockfile.lockSync(sessionPath, {
        stale: LOCK_STALE_MS,
        realpath: false,
      });
    } catch (error) {
      lastError = error;
      if (attempt === LOCK_MAX_ATTEMPTS - 1) break;
      const delay = Math.min(
        LOCK_BACKOFF_MS.min * LOCK_BACKOFF_MS.factor ** attempt,
        LOCK_BACKOFF_MS.max
      );
      sleepSync(delay);
    }
  }

  throw new Error(
    `Failed to acquire session snapshot lock: ${sessionPath}`,
    { cause: lastError }
  );
};

export const readSnapshot = (sessionPath: string): SessionSnapshot | null => {
  if (!fs.existsSync(sessionPath)) return null;

  const raw = fs.readFileSync(sessionPath, "utf8");
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
    throw new Error(
      `Invalid session snapshot schema at ${sessionPath}: ${parsed.error.message}`
    );
  }
  return parsed.data;
};

export const readSnapshotOrEmpty = (sessionPath: string): SessionSnapshot =>
  readSnapshot(sessionPath) ?? createEmptySnapshot();

export const writeSnapshot = (
  sessionPath: string,
  snapshot: SessionSnapshot
) => {
  const dir = path.dirname(sessionPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${sessionPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, sessionPath);
};

/**
 * Exclusive writer critical section:
 * lock → read latest → apply mutation → atomic replace → unlock.
 *
 * Locks a stable sidecar (`*.lock`) so atomic rename of the snapshot
 * does not drop the inter-process exclusion.
 */
export const withLockedMutation = (
  sessionPath: string,
  mutate: (prev: SessionSnapshot) => SessionSnapshot
): SessionSnapshot => {
  const dir = path.dirname(sessionPath);
  fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(sessionPath)) {
    writeSnapshot(sessionPath, createEmptySnapshot());
  }

  const release = acquireLockSync(sessionPath);
  try {
    const prev = readSnapshotOrEmpty(sessionPath);
    const next = mutate(prev);
    writeSnapshot(sessionPath, next);
    return next;
  } finally {
    release();
  }
};
