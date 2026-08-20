import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FlattenHandler, HttpHandlerBehavior, HttpMethod } from "../../shared/types";
import { readSnapshot, writeSnapshot } from "./file";
import { bumpSnapshot } from "./serialize";
import { SessionController } from "./controller";
import { getSessionPathForPid } from "./sessionPath";

const tempDirs: string[] = [];

const originalCwd = process.cwd();
const createTempSessionPath = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "msw-session-controller-"));
  tempDirs.push(dir);
  process.chdir(dir);
  return getSessionPathForPid(process.pid, dir);
};

const createFlattenHandler = (): FlattenHandler => ({
  id: "handler-a",
  path: "/api/a",
  method: HttpMethod.GET,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- test-only opaque runtime handler
  handler: {} as FlattenHandler["handler"],
  behavior: HttpHandlerBehavior.DEFAULT,
  type: "default",
});

afterEach(() => {
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("SessionController", () => {
  it("does nothing when synchronized before start", async () => {
    const onSnapshot = vi.fn();
    const controller = new SessionController({ onSnapshot, onReset: () => [] });
    await expect(controller.sync()).resolves.toBeUndefined();
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("seeds a session and applies each newer non-reset snapshot once", async () => {
    const sessionPath = createTempSessionPath();
    const onSnapshot = vi.fn();
    const controller = new SessionController({
      onSnapshot,
      onReset: () => [createFlattenHandler()],
    });

    await controller.start([createFlattenHandler()]);
    const seeded = (await readSnapshot(sessionPath))!;
    expect(seeded.revision).toBe(1);
    expect(seeded.state.flattenHandlers).toHaveLength(1);

    const next = bumpSnapshot(seeded, {
      flattenHandlers: seeded.state.flattenHandlers.map((handler) => ({
        ...handler,
        behavior: HttpHandlerBehavior.DELAY,
      })),
    });
    await writeSnapshot(sessionPath, next);

    await controller.sync();
    await controller.sync();

    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(onSnapshot).toHaveBeenCalledWith(next);
    await controller.dispose();
  });

  it("acknowledges reset and removes session artifacts on dispose", async () => {
    const sessionPath = createTempSessionPath();
    const onReset = vi.fn(() => [createFlattenHandler()]);
    const controller = new SessionController({ onSnapshot: vi.fn(), onReset });

    await controller.start([createFlattenHandler()]);
    const resetRequest = bumpSnapshot((await readSnapshot(sessionPath))!, {
      pendingReset: true,
    });
    await writeSnapshot(sessionPath, resetRequest);

    await controller.sync();

    expect(onReset).toHaveBeenCalledTimes(1);
    expect((await readSnapshot(sessionPath))?.state.pendingReset).toBeUndefined();

    // Second sync on the same revision exercises the "lastWrittenRevision === revision" branch.
    await controller.sync();
    expect(onReset).toHaveBeenCalledTimes(1);

    await controller.dispose();
    expect(fs.existsSync(sessionPath)).toBe(false);
    expect(fs.existsSync(`${sessionPath}.lock`)).toBe(false);
  });

  it("writes WebSocket state from onResetWebSocket during a pending reset", async () => {
    const sessionPath = createTempSessionPath();
    const onResetWebSocket = vi.fn(() => []);
    const controller = new SessionController({
      onSnapshot: vi.fn(),
      onReset: () => [createFlattenHandler()],
      onResetWebSocket,
    });

    await controller.start([createFlattenHandler()], [{
      info: {
        id: "endpoint:ws",
        kind: "websocket",
        endpoint: "ws://controller.test",
        operation: "endpoint",
        source: "temp",
      },
      endpointId: "endpoint:ws",
      matcher: { kind: "string", value: "ws://controller.test" },
      enabled: true,
      listeners: [],
    }]);
    const resetRequest = bumpSnapshot((await readSnapshot(sessionPath))!, {
      pendingReset: true,
    });
    await writeSnapshot(sessionPath, resetRequest);

    await controller.sync();

    expect(onResetWebSocket).toHaveBeenCalledTimes(1);
    expect((await readSnapshot(sessionPath))?.state.webSocket).toEqual([]);
    await controller.dispose();
  });

  it("recovers previous WebSocket state when a reset snapshot omits it", async () => {
    const sessionPath = createTempSessionPath();
    const controller = new SessionController({
      onSnapshot: vi.fn(),
      onReset: () => [createFlattenHandler()],
    });

    await controller.start([createFlattenHandler()]);
    const seeded = (await readSnapshot(sessionPath))!;
    await writeSnapshot(sessionPath, {
      ...seeded,
      revision: seeded.revision + 1,
      state: {
        flattenHandlers: seeded.state.flattenHandlers,
        pendingReset: true,
      },
    } as typeof seeded);

    await controller.sync();

    expect((await readSnapshot(sessionPath))?.state.webSocket).toEqual([]);
    await controller.dispose();
  });

  it("ignores a sync error and continues", async () => {
    createTempSessionPath();
    const onSnapshot = vi.fn();
    const controller = new SessionController({
      onSnapshot,
      onReset: () => [createFlattenHandler()],
    });

    await controller.start([createFlattenHandler()]);
    // Force syncNow to throw by clearing the repository reference via dispose internals.
    // Instead, write an invalid JSON file to trigger a read error on the next sync.
    const sessionPath = controller.sessionPath!;
    await fs.promises.writeFile(sessionPath, "not json");

    await expect(controller.sync()).resolves.toBeUndefined();
    expect(onSnapshot).not.toHaveBeenCalled();
    await controller.dispose();
  });

  it("skips sync while disposing", async () => {
    createTempSessionPath();
    const onSnapshot = vi.fn();
    const controller = new SessionController({
      onSnapshot,
      onReset: () => [createFlattenHandler()],
    });

    await controller.start([createFlattenHandler()]);
    const disposePromise = controller.dispose();
    // sync called after dispose starts should be a no-op
    await controller.sync();
    await disposePromise;
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("fires onSnapshot for newer revisions written by other processes", async () => {
    const sessionPath = createTempSessionPath();
    const onSnapshot = vi.fn();
    const controller = new SessionController({
      onSnapshot,
      onReset: () => [createFlattenHandler()],
    });

    await controller.start([createFlattenHandler()]);
    const seeded = (await readSnapshot(sessionPath))!;
    const next = bumpSnapshot(seeded, {
      flattenHandlers: seeded.state.flattenHandlers.map((h) => ({
        ...h,
        behavior: "delay" as typeof h.behavior,
      })),
    });
    await writeSnapshot(sessionPath, next);

    await controller.sync();
    expect(onSnapshot).toHaveBeenCalledOnce();
    expect(onSnapshot).toHaveBeenCalledWith(next);

    // Second sync with same revision triggers the lastWrittenRevision === revision branch (L84).
    await controller.sync();
    expect(onSnapshot).toHaveBeenCalledOnce();
    await controller.dispose();
  });

});
