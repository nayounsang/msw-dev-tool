import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { http, HttpResponse } from "msw";
import { ws } from "../msw";
import { afterEach, describe, expect, it } from "vitest";
import {
  nodeHandlerStore,
  readSnapshot,
  setSnapshotBehavior,
  addSnapshotTempHandler,
  requestSnapshotReset,
  syncNodeSession,
  disposeNodeSession,
  getNodeSessionPath,
  HttpHandlerBehavior,
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
  getSessionPathForPid,
} from "./internal";
import { setupDevToolServer } from "./index";

const tempDirs: string[] = [];
const originalCwd = process.cwd();

afterEach(async () => {
  await disposeNodeSession();
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const makeSession = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "msw-node-store-"));
  tempDirs.push(dir);
  process.chdir(dir);
  const sessionPath = getSessionPathForPid(process.pid, dir);
  return sessionPath;
};

describe("setupDevToolServer", () => {
  it("initializes server, writes snapshot, and applies external behavior changes", async () => {
    const sessionPath = makeSession();
    const server = await setupDevToolServer(
      http.get("/api/items", () => HttpResponse.json({ ok: true })),
    );

    expect(server).toBeTruthy();
    expect(getNodeSessionPath()).toBe(getSessionPathForPid(process.pid));
    expect(nodeHandlerStore.getState().flattenHandlers).toHaveLength(1);

    const snap = await readSnapshot(sessionPath);
    expect(snap?.state.flattenHandlers).toHaveLength(1);

    const id = nodeHandlerStore.getState().flattenHandlers[0]!.id;
    await setSnapshotBehavior(sessionPath, id, HttpHandlerBehavior.DELAY);

    await syncNodeSession();

    expect(nodeHandlerStore.getState().getHandlerBehavior(id)).toBe(HttpHandlerBehavior.DELAY);
  });

  it("rejects a second active Node session in the same process", async () => {
    makeSession();
    await setupDevToolServer(http.get("/api/first", () => HttpResponse.json({ ok: true })));

    await expect(
      setupDevToolServer(http.get("/api/second", () => HttpResponse.json({ ok: true }))),
    ).rejects.toThrow(/already initialized/);
  });

  it("seeds snapshot on setup and does not persist later in-process edits", async () => {
    const sessionPath = makeSession();

    await setupDevToolServer(http.get("/api/items", () => HttpResponse.json({ ok: true })));

    const seeded = await readSnapshot(sessionPath);
    expect(seeded?.state.flattenHandlers).toHaveLength(1);
    expect(seeded?.state.flattenHandlers[0]?.behavior).toBe(HttpHandlerBehavior.DEFAULT);

    const id = nodeHandlerStore.getState().flattenHandlers[0]!.id;
    nodeHandlerStore.getState().setHandlerEnabled(id, false);

    expect(nodeHandlerStore.getState().getFlattenHandlerById(id)?.enabled).toBe(false);
    expect((await readSnapshot(sessionPath))?.state.flattenHandlers[0]?.behavior).toBe(
      HttpHandlerBehavior.DEFAULT,
    );
  });

  it("applies external temp handlers and reset via syncNodeSession", async () => {
    const sessionPath = makeSession();

    await setupDevToolServer(http.get("/api/items", () => HttpResponse.json({ ok: true })));

    await addSnapshotTempHandler(sessionPath, {
      path: "/api/tmp",
      method: HttpMethod.GET,
      contentType: MimeType.APPLICATION_JSON,
      status: StringHttpStatusCode.OK,
      response: '{"ok":true}',
    });

    await syncNodeSession();
    expect(nodeHandlerStore.getState().flattenHandlers.some((h) => h.type === "temp")).toBe(true);

    await requestSnapshotReset(sessionPath);
    await syncNodeSession();

    expect(nodeHandlerStore.getState().flattenHandlers.every((h) => h.type === "default")).toBe(
      true,
    );
    expect((await readSnapshot(sessionPath))?.state.pendingReset).toBeUndefined();
  });

  it("publishes runtime-discovered WebSocket listeners to the Node snapshot", async () => {
    const sessionPath = makeSession();
    const chat = ws.link("ws://node.test/chat");
    const handler = chat.addEventListener("connection", ({ client }) => {
      client.addEventListener("message", () => undefined, {
        mswDevTool: {
          eventTypes: ["chat/message"],
          resolveEventType: () => "chat/message",
        },
      });
    });
    const server = await setupDevToolServer(
      http.get("https://node.test/items", () => HttpResponse.json({ ok: true })),
      handler,
    );
    const httpId = nodeHandlerStore.getState().flattenHandlers[0]!.id;
    await setSnapshotBehavior(sessionPath, httpId, HttpHandlerBehavior.DELAY);
    server.listen();
    const socket = new WebSocket("ws://node.test/chat");
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("WebSocket open failed")), {
        once: true,
      });
    });
    await syncNodeSession();

    expect(nodeHandlerStore.getState().webSocketEndpoints).toEqual([
      expect.objectContaining({
        endpoint: "ws://node.test/chat",
        source: "code",
      }),
    ]);
    expect((await readSnapshot(sessionPath))?.state.webSocket?.[0]?.listeners[0]).toMatchObject({
      eventBranches: [
        { eventType: "chat/message", enabled: true, behavior: { preset: "default" } },
      ],
    });
    expect(nodeHandlerStore.getState().getHandlerBehavior(httpId)).toBe(HttpHandlerBehavior.DELAY);

    const secondSocket = new WebSocket("ws://node.test/chat");
    await new Promise<void>((resolve, reject) => {
      secondSocket.addEventListener("open", () => resolve(), { once: true });
      secondSocket.addEventListener("error", () => reject(new Error("WebSocket open failed")), {
        once: true,
      });
    });
    await syncNodeSession();

    secondSocket.close();
    socket.close();
    server.close();
  });
});
