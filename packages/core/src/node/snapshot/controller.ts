import { FSWatcher, watch } from "chokidar";
import fs from "node:fs/promises";
import { FlattenHandler } from "../../shared/types";
import { clearSessionArtifacts, ensureSessionPath } from "./sessionPath";
import { bumpSnapshot, createEmptySnapshot, toSerializableFlattenHandlers } from "./serialize";
import { SnapshotRepository } from "./repository";
import { SessionSnapshot } from "./types";
import type { WebSocketEndpointConfig } from "../../shared/types";
import { webSocketEndpointsSchema } from "../../shared/schema/websocket";

const DEFAULT_POLL_INTERVAL_MS = 200;
const WATCH_DEBOUNCE_MS = 25;

const isEnoent = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";

export type SessionControllerOptions = {
  onSnapshot: (snapshot: SessionSnapshot) => void;
  onReset: () => FlattenHandler[];
  onResetWebSocket?: () => WebSocketEndpointConfig[];
  pollIntervalMs?: number;
};

/** Owns the lifecycle and disk synchronization of one Node session. */
export class SessionController {
  private repository: SnapshotRepository | null = null;
  private lastWrittenRevision = 0;
  private lastAppliedRevision = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private watcher: FSWatcher | null = null;
  private watchDebounce: ReturnType<typeof setTimeout> | null = null;
  private exitHandler: (() => void) | null = null;
  private signalHandlers = new Map<NodeJS.Signals, () => void>();
  private syncQueue: Promise<void> = Promise.resolve();
  private disposing = false;
  private disposePromise: Promise<void> | null = null;
  private shuttingDown = false;
  private cleanedUp = false;

  public constructor(private readonly options: SessionControllerOptions) {}

  public get sessionPath(): string | null {
    return this.repository?.sessionPath ?? null;
  }

  public async start(flattenHandlers: FlattenHandler[], webSocket: WebSocketEndpointConfig[] = []): Promise<void> {
    const sessionPath = await ensureSessionPath();
    this.repository = new SnapshotRepository(sessionPath);
    this.cleanedUp = false;
    // A reused PID may have left a stale file/lock after a crash.
    await clearSessionArtifacts(sessionPath);

    const seeded = await this.repository.mutate(() =>
      bumpSnapshot(createEmptySnapshot(), {
      flattenHandlers: toSerializableFlattenHandlers(flattenHandlers),
      webSocket: webSocketEndpointsSchema.parse(webSocket),
      })
    );
    this.lastWrittenRevision = seeded.revision;
    this.lastAppliedRevision = seeded.revision;

    await this.startWatching();
    this.registerExitHandler();
  }

  public sync(): Promise<void> {
    if (this.disposing) return this.syncQueue;
    this.syncQueue = this.syncQueue
      .then(() => this.syncNow())
      .catch((error: unknown) => {
        console.warn("[msw-dev-tool] failed to synchronize session snapshot", error);
      });
    return this.syncQueue;
  }

  private async syncNow(): Promise<void> {
    const repository = this.repository;
    if (!repository) return;

    const snapshot = await repository.read();
    if (!snapshot || snapshot.revision <= this.lastAppliedRevision) return;

    if (snapshot.revision === this.lastWrittenRevision) {
      this.lastAppliedRevision = snapshot.revision;
      return;
    }

    if (snapshot.state.pendingReset) {
      const flattenHandlers = this.options.onReset();
      const webSocket = this.options.onResetWebSocket?.() ?? previousWebSocket(snapshot);
      const cleared = await repository.mutate((previous) => {
        if (!previous.state.pendingReset) return previous;
        return bumpSnapshot(previous, {
          flattenHandlers: toSerializableFlattenHandlers(flattenHandlers),
          webSocket: webSocketEndpointsSchema.parse(webSocket),
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

  public async dispose(): Promise<void> {
    if (this.disposePromise) return this.disposePromise;

    this.disposing = true;
    this.disposePromise = (async () => {
      await this.stopWatching();
      await this.syncQueue;
      this.unregisterExitHandler();
      const sessionPath = this.sessionPath;
      if (sessionPath && !this.cleanedUp) {
        await clearSessionArtifacts(sessionPath);
        this.cleanedUp = true;
      }
      this.repository = null;
    })();
    return this.disposePromise;
  }

  private async startWatching(): Promise<void> {
    const repository = this.repository;
    if (!repository) return;

    await this.stopWatching();
    try {
      await fs.access(repository.sessionPath);
    } catch (error) {
      if (!isEnoent(error)) throw error;
      await repository.write(createEmptySnapshot());
    }

    this.watcher = watch(repository.sessionPath, {
      atomic: true,
      ignoreInitial: true,
      persistent: false,
    });
    this.watcher.on("all", (event) => {
      if (event === "add" || event === "change") this.scheduleSync();
    });
    this.watcher.on("error", () => {
      void this.watcher?.close();
      this.watcher = null;
    });

    this.pollTimer = setInterval(
      () => void this.sync(),
      this.options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
    );
    this.pollTimer.unref?.();
  }

  private scheduleSync(): void {
    if (this.watchDebounce) clearTimeout(this.watchDebounce);
    this.watchDebounce = setTimeout(() => {
      this.watchDebounce = null;
      void this.sync();
    }, WATCH_DEBOUNCE_MS);
  }

  private async stopWatching(): Promise<void> {
    if (this.watchDebounce) clearTimeout(this.watchDebounce);
    this.watchDebounce = null;
    if (this.watcher) await this.watcher.close();
    this.watcher = null;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  private registerExitHandler(): void {
    if (this.exitHandler) return;
    this.exitHandler = () => void this.dispose();
    process.once("beforeExit", this.exitHandler);
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      const handler = () => {
        if (this.shuttingDown) return;
        this.shuttingDown = true;
        void this.dispose().finally(() => {
          // Restore Node's default signal behavior after self-only cleanup.
          process.kill(process.pid, signal);
        });
      };
      this.signalHandlers.set(signal, handler);
      process.once(signal, handler);
    }
  }

  private unregisterExitHandler(): void {
    if (!this.exitHandler) return;
    process.off("beforeExit", this.exitHandler);
    this.exitHandler = null;
    for (const [signal, handler] of this.signalHandlers) {
      process.off(signal, handler);
    }
    this.signalHandlers.clear();
  }
}

const previousWebSocket = (snapshot: SessionSnapshot) =>
  webSocketEndpointsSchema.parse(snapshot.state.webSocket ?? []);
