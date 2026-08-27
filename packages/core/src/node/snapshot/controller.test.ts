import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { http } from "msw";
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
  handler: http.get("https://controller.test/handler-a", () => new Response()),
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
    await expect(controller.publishWebSocket(() => [])).resolves.toBeUndefined();
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("publishes discovered WebSocket state only when it changes", async () => {
    const sessionPath = createTempSessionPath();
    const controller = new SessionController({ onSnapshot: vi.fn(), onReset: () => [] });
    const webSocket = [
      {
        info: {
          id: "endpoint:published",
          kind: "websocket" as const,
          endpoint: "ws://controller.test/published",
          operation: "endpoint",
          source: "code" as const,
        },
        endpointId: "endpoint:published",
        matcher: { kind: "string" as const, value: "ws://controller.test/published" },
        enabled: true,
        listeners: [],
      },
    ];

    await controller.start([createFlattenHandler()]);
    await controller.publishWebSocket(() => webSocket);
    const published = (await readSnapshot(sessionPath))!;
    await controller.publishWebSocket(() => webSocket);

    expect(published.state.webSocket).toEqual(webSocket);
    expect((await readSnapshot(sessionPath))?.revision).toBe(published.revision);
    await controller.dispose();
  });

  it("applies a concurrent external revision before publishing WebSocket discovery", async () => {
    const sessionPath = createTempSessionPath();
    let runtimeWebSocket = [
      {
        info: {
          id: "endpoint:concurrent",
          kind: "websocket" as const,
          endpoint: "ws://controller.test/concurrent",
          operation: "endpoint",
          source: "code" as const,
        },
        endpointId: "endpoint:concurrent",
        matcher: {
          kind: "string" as const,
          value: "ws://controller.test/concurrent",
        },
        enabled: true,
        listeners: [
          {
            info: {
              id: "endpoint:concurrent:message:0",
              kind: "websocket" as const,
              endpoint: "ws://controller.test/concurrent",
              operation: "message",
              source: "code" as const,
            },
            endpointId: "endpoint:concurrent",
            event: "message" as const,
            enabled: true,
            behavior: { preset: "default" as const },
            eventBranches: [
              {
                eventType: "chat/message",
                enabled: true,
                behavior: { preset: "default" as const },
              },
            ],
          },
        ],
      },
    ];
    const onSnapshot = vi.fn((snapshot) => {
      runtimeWebSocket = snapshot.state.webSocket ?? [];
    });
    const controller = new SessionController({ onSnapshot, onReset: () => [] });
    await controller.start([createFlattenHandler()], runtimeWebSocket);
    const seeded = (await readSnapshot(sessionPath))!;
    const external = bumpSnapshot(seeded, {
      flattenHandlers: seeded.state.flattenHandlers.map((handler) => ({
        ...handler,
        behavior: HttpHandlerBehavior.DELAY,
      })),
      webSocket: runtimeWebSocket.map((endpoint) => ({
        ...endpoint,
        listeners: endpoint.listeners.map((listener) => ({
          ...listener,
          eventBranches: listener.eventBranches?.map((branch) => ({
            ...branch,
            behavior: { preset: "echo" as const },
          })),
        })),
      })),
    });
    let injected = false;

    await controller.publishWebSocket(() => {
      if (!injected) {
        injected = true;
        fs.writeFileSync(sessionPath, `${JSON.stringify(external, null, 2)}\n`, "utf8");
      }
      return runtimeWebSocket;
    });

    const published = (await readSnapshot(sessionPath))!;
    expect(onSnapshot).toHaveBeenCalledWith(external);
    expect(published.state.flattenHandlers[0]?.behavior).toBe(HttpHandlerBehavior.DELAY);
    expect(published.state.webSocket?.[0]?.listeners[0]?.eventBranches?.[0]?.behavior).toEqual({
      preset: "echo",
    });
    await controller.dispose();
  });

  it("stops a queued WebSocket publication when disposal starts", async () => {
    createTempSessionPath();
    const controller = new SessionController({ onSnapshot: vi.fn(), onReset: () => [] });
    await controller.start([createFlattenHandler()]);

    const publication = controller.publishWebSocket(() => []);
    const disposal = controller.dispose();
    const skippedPublication = controller.publishWebSocket(() => []);

    await expect(Promise.all([publication, skippedPublication, disposal])).resolves.toBeDefined();
  });

  it("reports a WebSocket publication failure without rejecting the queue", async () => {
    createTempSessionPath();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const controller = new SessionController({ onSnapshot: vi.fn(), onReset: () => [] });
    await controller.start([createFlattenHandler()]);

    await expect(
      controller.publishWebSocket(() => {
        throw new Error("failed discovery");
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      "[msw-dev-tool] failed to publish WebSocket session state",
      expect.objectContaining({ message: "failed discovery" }),
    );
    warn.mockRestore();
    await controller.dispose();
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

    await controller.start(
      [createFlattenHandler()],
      [
        {
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
        },
      ],
    );
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
