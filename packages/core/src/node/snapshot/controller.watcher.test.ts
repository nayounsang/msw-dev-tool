import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { http } from "msw";
import { FlattenHandler, HttpMethod } from "../../shared/types";
import { readSnapshot, writeSnapshot } from "./file";
import { bumpSnapshot } from "./serialize";

const watcherState = vi.hoisted(() => {
  let allHandler: ((event: string) => void) | undefined;
  const watcher = {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === "all") allHandler = handler as (event: string) => void;
      return watcher;
    }),
    close: vi.fn(async () => undefined),
  };

  return {
    watcher,
    emit(event: string) {
      allHandler?.(event);
    },
    reset() {
      allHandler = undefined;
      watcher.on.mockClear();
      watcher.close.mockClear();
    },
  };
});

vi.mock("chokidar", () => ({
  watch: vi.fn(() => watcherState.watcher),
}));

import { SessionController } from "./controller";
import { getSessionPathForPid } from "./sessionPath";

const tempDirs: string[] = [];
const originalCwd = process.cwd();

const createTempSessionPath = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "msw-session-controller-watcher-"));
  tempDirs.push(dir);
  process.chdir(dir);
  return getSessionPathForPid(process.pid, dir);
};

const createFlattenHandler = (): FlattenHandler => ({
  id: "handler-a",
  path: "/api/a",
  method: HttpMethod.GET,
  handler: http.get("https://controller.test/handler-a", () => new Response()),
  behavior: "default",
  type: "default",
});

beforeEach(() => {
  watcherState.reset();
  vi.useFakeTimers();
});

afterEach(async () => {
  vi.useRealTimers();
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("SessionController file watching", () => {
  it("debounces consecutive file changes into one synchronization", async () => {
    const sessionPath = createTempSessionPath();
    const onSnapshot = vi.fn();
    const controller = new SessionController({ onSnapshot, onReset: () => [] });

    await controller.start([createFlattenHandler()]);
    const seeded = (await readSnapshot(sessionPath))!;
    await writeSnapshot(
      sessionPath,
      bumpSnapshot(seeded, {
        flattenHandlers: seeded.state.flattenHandlers.map((handler) => ({
          ...handler,
          behavior: "delay",
        })),
      }),
    );

    watcherState.emit("change");
    watcherState.emit("change");
    await vi.advanceTimersByTimeAsync(24);
    expect(onSnapshot).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await controller.sync();
    expect(onSnapshot).toHaveBeenCalledOnce();
    await controller.dispose();
  });

  it("ignores watcher events that do not add or change the session file", async () => {
    const sessionPath = createTempSessionPath();
    const onSnapshot = vi.fn();
    const controller = new SessionController({ onSnapshot, onReset: () => [] });

    await controller.start([createFlattenHandler()]);
    const seeded = (await readSnapshot(sessionPath))!;
    await writeSnapshot(sessionPath, bumpSnapshot(seeded, { mockEnabled: false }));

    watcherState.emit("unlink");
    await vi.advanceTimersByTimeAsync(25);

    expect(onSnapshot).not.toHaveBeenCalled();
    await controller.dispose();
  });

  it("handles only the first termination signal during shutdown", async () => {
    createTempSessionPath();
    const controller = new SessionController({ onSnapshot: vi.fn(), onReset: () => [] });
    const kill = vi.spyOn(process, "kill").mockImplementation(() => true);

    try {
      await controller.start([createFlattenHandler()]);
      const signalHandler = (
        controller as unknown as {
          signalHandlers: Map<NodeJS.Signals, () => void>;
        }
      ).signalHandlers.get("SIGTERM");
      if (!signalHandler) throw new Error("Expected SIGTERM handler");
      signalHandler();
      signalHandler();

      await controller.dispose();
      await Promise.resolve();
      await Promise.resolve();

      expect(kill).toHaveBeenCalledOnce();
      expect(kill).toHaveBeenCalledWith(process.pid, "SIGTERM");
    } finally {
      kill.mockRestore();
    }
  });
});
