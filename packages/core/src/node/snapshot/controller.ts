import fs from "node:fs";
import { FlattenHandler } from "../../shared/types";
import { clearSessionArtifacts, ensureSessionPath } from "./sessionPath";
import { bumpSnapshot, createEmptySnapshot, toSerializableFlattenHandlers } from "./serialize";
import { SnapshotRepository } from "./repository";
import { SessionSnapshot } from "./types";

const DEFAULT_POLL_INTERVAL_MS = 200;
const WATCH_DEBOUNCE_MS = 25;

export type SessionControllerOptions = {
  onSnapshot: (snapshot: SessionSnapshot) => void;
  onReset: () => FlattenHandler[];
  pollIntervalMs?: number;
};

/** Owns the lifecycle and disk synchronization of one Node session. */
export class SessionController {
  private repository: SnapshotRepository | null = null;
  private lastWrittenRevision = 0;
  private lastAppliedRevision = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private watcher: fs.FSWatcher | null = null;
  private watchDebounce: ReturnType<typeof setTimeout> | null = null;
  private exitHandler: (() => void) | null = null;
  private cleanedUp = false;

  public constructor(private readonly options: SessionControllerOptions) {}

  public get sessionPath(): string | null {
    return this.repository?.sessionPath ?? null;
  }

  public start(flattenHandlers: FlattenHandler[]): void {
    const sessionPath = ensureSessionPath();
    this.repository = new SnapshotRepository(sessionPath);
    this.cleanedUp = false;

    const seeded = this.repository.mutate(() =>
      bumpSnapshot(createEmptySnapshot(), {
        flattenHandlers: toSerializableFlattenHandlers(flattenHandlers),
      })
    );
    this.lastWrittenRevision = seeded.revision;
    this.lastAppliedRevision = seeded.revision;

    this.startWatching();
    this.registerExitHandler();
  }

  public sync(): void {
    const repository = this.repository;
    if (!repository) return;

    const snapshot = repository.read();
    if (!snapshot || snapshot.revision <= this.lastAppliedRevision) return;

    if (snapshot.revision === this.lastWrittenRevision) {
      this.lastAppliedRevision = snapshot.revision;
      return;
    }

    if (snapshot.revision < this.lastWrittenRevision) {
      console.warn(
        `[msw-dev-tool] snapshot revision ${snapshot.revision} is older than last written revision ${this.lastWrittenRevision}; ignoring`
      );
      return;
    }

    if (snapshot.pendingReset) {
      const flattenHandlers = this.options.onReset();
      const cleared = repository.mutate((previous) => {
        if (!previous.pendingReset) return previous;
        return bumpSnapshot(previous, {
          flattenHandlers: toSerializableFlattenHandlers(flattenHandlers),
          pendingReset: false,
        });
      });
      this.lastWrittenRevision = cleared.revision;
      this.lastAppliedRevision = cleared.revision;
      return;
    }

    this.options.onSnapshot(snapshot);
    this.lastAppliedRevision = snapshot.revision;
  }

  public dispose(): void {
    this.stopWatching();
    this.unregisterExitHandler();
    const sessionPath = this.sessionPath;
    if (sessionPath && !this.cleanedUp) {
      clearSessionArtifacts(sessionPath);
      this.cleanedUp = true;
    }
    this.repository = null;
  }

  private startWatching(): void {
    const repository = this.repository;
    if (!repository) return;

    this.stopWatching();
    if (!fs.existsSync(repository.sessionPath)) {
      repository.write(createEmptySnapshot());
    }

    this.watcher = fs.watch(repository.sessionPath, () => this.scheduleSync());
    this.watcher.on("error", () => {
      this.watcher?.close();
      this.watcher = null;
    });

    this.pollTimer = setInterval(
      () => this.sync(),
      this.options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
    );
    this.pollTimer.unref?.();
  }

  private scheduleSync(): void {
    if (this.watchDebounce) clearTimeout(this.watchDebounce);
    this.watchDebounce = setTimeout(() => {
      this.watchDebounce = null;
      this.sync();
    }, WATCH_DEBOUNCE_MS);
  }

  private stopWatching(): void {
    if (this.watchDebounce) clearTimeout(this.watchDebounce);
    this.watchDebounce = null;
    this.watcher?.close();
    this.watcher = null;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  private registerExitHandler(): void {
    if (this.exitHandler) return;
    this.exitHandler = () => this.dispose();
    process.once("exit", this.exitHandler);
  }

  private unregisterExitHandler(): void {
    if (!this.exitHandler) return;
    process.off("exit", this.exitHandler);
    this.exitHandler = null;
  }
}
