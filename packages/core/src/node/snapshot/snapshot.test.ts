import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";
import {
  bumpSnapshot,
  createEmptySnapshot,
  readSnapshot,
  writeSnapshot,
  withLockedMutation,
  setSnapshotBehavior,
  setSnapshotCustomResponse,
  addSnapshotTempHandler,
  removeSnapshotTempHandler,
  requestSnapshotReset,
  getSnapshotHandler,
  getSnapshotWebSocketEndpoint,
  listSnapshotHandlers,
  listSnapshotWebSocketEndpoints,
  addSnapshotWebSocketEndpoint,
  addSnapshotWebSocketListener,
  removeSnapshotWebSocketEndpoint,
  removeSnapshotWebSocketListener,
  setSnapshotWebSocketEndpointEnabled,
  setSnapshotWebSocketListenerBehavior,
  setSnapshotWebSocketListenerEnabled,
  readSnapshotOrEmpty,
  getSessionPathForPid,
  listSessionPids,
  applySnapshotToRuntime,
  SnapshotRepository,
} from "./index";
import {
  HttpHandlerBehavior,
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "../../shared/types";
import { FlattenHandler } from "../../shared/types";
import { getRowId } from "../../shared/utils/store";
import { webSocketEndpointSchema } from "../../shared/schema/websocket";

const require = createRequire(import.meta.url);
const tempDirs: string[] = [];

const makeTempDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "msw-snap-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("snapshot file protocol", () => {
  it("exercises the SnapshotRepository read, write, and mutation boundary", async () => {
    const dir = makeTempDir();
    const repository = new SnapshotRepository(path.join(dir, "session.json"));
    await expect(repository.read()).resolves.toBeNull();
    await expect(repository.readOrEmpty()).resolves.toEqual(createEmptySnapshot());

    await repository.write(createEmptySnapshot());
    const next = await repository.mutate((snapshot) => bumpSnapshot(snapshot, { flattenHandlers: [] }));
    await expect(repository.read()).resolves.toEqual(next);
  });

  it("writes and reads snapshots atomically", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    const snap = bumpSnapshot(createEmptySnapshot(), {
      flattenHandlers: [
        {
          id: "a",
          path: "/a",
          method: HttpMethod.GET,
          behavior: HttpHandlerBehavior.DEFAULT,
          type: "default",
        },
      ],
    });
    await writeSnapshot(sessionPath, snap);
    expect(await readSnapshot(sessionPath)).toEqual(snap);
  });

  it("bumps revision on setSnapshotBehavior", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await writeSnapshot(
      sessionPath,
      bumpSnapshot(createEmptySnapshot(), {
        flattenHandlers: [
          {
            id: JSON.stringify({ path: "/api", method: "get" }),
            path: "/api",
            method: HttpMethod.GET,
            behavior: HttpHandlerBehavior.DEFAULT,
            type: "default",
          },
        ],
      })
    );

    const next = await setSnapshotBehavior(
      sessionPath,
      JSON.stringify({ path: "/api", method: "get" }),
      HttpHandlerBehavior.DELAY
    );
    expect(next.revision).toBe(2);
    expect(next.state.flattenHandlers[0]?.behavior).toBe(HttpHandlerBehavior.DELAY);
  });

  it("stores a custom response without changing behavior", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await writeSnapshot(sessionPath, bumpSnapshot(createEmptySnapshot(), {
      flattenHandlers: [{ id: "a", path: "/api", method: HttpMethod.GET, behavior: HttpHandlerBehavior.DEFAULT, type: "default" }],
    }));

    const next = await setSnapshotCustomResponse(sessionPath, "a", {
      status: 201,
      body: "created",
      headers: { "X-Created": "yes" },
    });

    expect(next).toMatchObject({ revision: 2, state: { flattenHandlers: [{ behavior: HttpHandlerBehavior.DEFAULT, customResponse: { status: 201, body: "created" } }] } });
  });

  it("adds temp handlers with tempInput", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await writeSnapshot(sessionPath, createEmptySnapshot());

    const next = await addSnapshotTempHandler(sessionPath, {
      path: "/api/tmp",
      method: HttpMethod.GET,
      contentType: MimeType.APPLICATION_JSON,
      status: StringHttpStatusCode.OK,
      response: '{"ok":true}',
    });

    expect(next.state.flattenHandlers).toHaveLength(1);
    expect(next.state.flattenHandlers[0]?.type).toBe("temp");
    expect(next.state.flattenHandlers[0]?.tempInput?.path).toBe("/api/tmp");
  });

  it("reads and mutates WebSocket endpoints in a snapshot", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await fs.promises.writeFile(sessionPath, JSON.stringify({
      revision: 0,
      owner: { pid: process.pid },
      state: { flattenHandlers: [] },
    }));

    await expect(listSnapshotWebSocketEndpoints(sessionPath)).resolves.toEqual([]);
    const added = await addSnapshotWebSocketEndpoint(sessionPath, { kind: "string", value: "ws://snapshot.test/chat" });
    const endpoint = added.state.webSocket![0]!;
    expect(endpoint).toMatchObject({
      endpointId: "websocket:endpoint:string:ws://snapshot.test/chat:0",
      info: { source: "temp", endpoint: "ws://snapshot.test/chat" },
      enabled: true,
    });
    const withListener = await addSnapshotWebSocketListener(sessionPath, endpoint.endpointId, { preset: "send", options: { message: "hello" } });
    const listener = withListener.state.webSocket![0]!.listeners[0]!;

    await setSnapshotWebSocketEndpointEnabled(sessionPath, endpoint.endpointId, false);
    await setSnapshotWebSocketListenerEnabled(sessionPath, listener.info.id, false);
    await setSnapshotWebSocketListenerBehavior(sessionPath, listener.info.id, { preset: "close", options: { code: 4000 } });
    await expect(getSnapshotWebSocketEndpoint(sessionPath, endpoint.endpointId)).resolves.toMatchObject({
      enabled: false,
      listeners: [{ enabled: false, behavior: { preset: "close", options: { code: 4000 } } }],
    });

    await removeSnapshotWebSocketListener(sessionPath, listener.info.id);
    await removeSnapshotWebSocketEndpoint(sessionPath, endpoint.endpointId);
    await expect(listSnapshotWebSocketEndpoints(sessionPath)).resolves.toEqual([]);
  });

  it("rejects invalid WebSocket targets and preserves code-source entries", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    const codeEndpoint = webSocketEndpointSchema.parse({
      info: { id: "code-chat", kind: "websocket", endpoint: "ws://code.test/chat", operation: "endpoint", source: "code" },
      endpointId: "code-chat",
      matcher: { kind: "string", value: "ws://code.test/chat" },
      enabled: true,
      listeners: [{
        info: { id: "code-chat:message:0", kind: "websocket", endpoint: "ws://code.test/chat", operation: "message", source: "code" },
        endpointId: "code-chat", event: "message", enabled: true, behavior: { preset: "default" },
      }],
    });
    await writeSnapshot(sessionPath, bumpSnapshot(createEmptySnapshot(), { webSocket: [codeEndpoint] }));

    await expect(removeSnapshotWebSocketEndpoint(sessionPath, "code-chat")).rejects.toThrow("cannot be deleted");
    await expect(removeSnapshotWebSocketListener(sessionPath, "code-chat:message:0")).rejects.toThrow("cannot be deleted");
    await expect(setSnapshotWebSocketEndpointEnabled(sessionPath, "missing", false)).rejects.toThrow("not found");
    await expect(addSnapshotWebSocketListener(sessionPath, "missing", { preset: "send" })).rejects.toThrow("not found");
    await expect(removeSnapshotWebSocketListener(sessionPath, "missing")).rejects.toThrow("not found");
    await expect(setSnapshotWebSocketListenerEnabled(sessionPath, "missing", false)).rejects.toThrow("not found");
    await expect(setSnapshotWebSocketListenerBehavior(sessionPath, "missing", { preset: "close" })).rejects.toThrow("not found");
    await expect(listSnapshotWebSocketEndpoints(sessionPath)).resolves.toEqual([codeEndpoint]);
  });

  it("preserves regexp matchers and allocates fresh endpoint and listener IDs", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await writeSnapshot(sessionPath, createEmptySnapshot());
    const matcher = { kind: "string" as const, value: "ws://snapshot.test/chat" };

    const first = (await addSnapshotWebSocketEndpoint(sessionPath, matcher)).state.webSocket![0]!;
    const second = (await addSnapshotWebSocketEndpoint(sessionPath, matcher)).state.webSocket![1]!;
    expect([first.endpointId, second.endpointId]).toEqual([
      "websocket:endpoint:string:ws://snapshot.test/chat:0",
      "websocket:endpoint:string:ws://snapshot.test/chat:1",
    ]);

    const firstListener = (await addSnapshotWebSocketListener(sessionPath, first.endpointId, { preset: "send", options: { message: "first" } }))
      .state.webSocket![0]!.listeners[0]!;
    const secondListener = (await addSnapshotWebSocketListener(sessionPath, first.endpointId, { preset: "send", options: { message: "second" } }))
      .state.webSocket![0]!.listeners[1]!;
    await removeSnapshotWebSocketListener(sessionPath, firstListener.info.id);
    const replacement = (await addSnapshotWebSocketListener(sessionPath, first.endpointId, { preset: "send", options: { message: "replacement" } }))
      .state.webSocket![0]!.listeners.find((listener) => listener.info.id !== secondListener.info.id)!;
    expect(replacement.info.id).toBe(`${first.endpointId}:temp:message:2`);

    const regexp = await addSnapshotWebSocketEndpoint(sessionPath, {
      kind: "regexp",
      source: "snapshot\\.test/regex",
      flags: "i",
    });
    expect(regexp.state.webSocket!.at(-1)!.info.endpoint).toBe("/snapshot\\.test/regex/i");
  });

  it("rejects invalid WebSocket mutations without changing the snapshot", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await writeSnapshot(sessionPath, createEmptySnapshot());
    const endpoint = (await addSnapshotWebSocketEndpoint(sessionPath, {
      kind: "string",
      value: "ws://snapshot.test/chat",
    })).state.webSocket![0]!;
    const listener = (await addSnapshotWebSocketListener(sessionPath, endpoint.endpointId, {
      preset: "send",
      options: { message: "before" },
    })).state.webSocket![0]!.listeners[0]!;

    await expect(addSnapshotWebSocketEndpoint(sessionPath, {
      kind: "regexp",
      source: "snapshot.test",
      flags: "invalid",
    })).rejects.toThrow("WebSocket regular-expression matcher must be valid");
    await expect(addSnapshotWebSocketListener(sessionPath, endpoint.endpointId, { preset: "send" }))
      .rejects.toThrow();
    await expect(setSnapshotWebSocketListenerBehavior(sessionPath, listener.info.id, { preset: "close", options: { code: "4000" } }))
      .rejects.toThrow();

    await expect(getSnapshotWebSocketEndpoint(sessionPath, endpoint.endpointId)).resolves.toMatchObject({
      listeners: [{ behavior: { preset: "send", options: { message: "before" } } }],
    });
    await expect(listSnapshotWebSocketEndpoints(sessionPath)).resolves.toHaveLength(1);
  });

  it("serializes concurrent WebSocket endpoint mutations without lost updates", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await writeSnapshot(sessionPath, createEmptySnapshot());

    await Promise.all(Array.from({ length: 2 }, (_, index) =>
      addSnapshotWebSocketEndpoint(sessionPath, {
        kind: "string",
        value: `ws://snapshot.test/concurrent/${index}`,
      })
    ));

    const endpoints = await listSnapshotWebSocketEndpoints(sessionPath);
    expect(endpoints).toHaveLength(2);
    expect(new Set(endpoints.map((endpoint) => endpoint.endpointId))).toHaveLength(2);
  });

  it("uses PID-named session files in the caller cwd", async () => {
    const dir = makeTempDir();
    const sessionPath = getSessionPathForPid(4182, dir);
    await writeSnapshot(sessionPath, createEmptySnapshot());
    expect(sessionPath).toBe(path.join(dir, ".msw-dev-tool", "sessions", "4182.json"));
    expect(await listSessionPids(dir)).toEqual([4182]);
  });

  it("applies sequential locked mutations without lost updates", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await writeSnapshot(sessionPath, createEmptySnapshot());

    const writerCount = 20;
    for (let i = 0; i < writerCount; i += 1) {
      await withLockedMutation(sessionPath, (prev) =>
        bumpSnapshot(prev, {
          flattenHandlers: [
            ...prev.state.flattenHandlers,
            {
              id: `h-${i}`,
              path: `/h-${i}`,
              method: HttpMethod.GET,
              behavior: HttpHandlerBehavior.DEFAULT,
              type: "default",
            },
          ],
        })
      );
    }

    const final = await readSnapshot(sessionPath);
    expect(final?.revision).toBe(writerCount);
    expect(final?.state.flattenHandlers).toHaveLength(writerCount);
    expect(final?.state.flattenHandlers.map((h) => h.id).sort()).toEqual(
      Array.from({ length: writerCount }, (_, i) => `h-${i}`).sort()
    );
  });

  it("serializes multi-process writers without lost updates", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await writeSnapshot(sessionPath, createEmptySnapshot());

    const writerScript = path.join(dir, "writer.cjs");
    const lockfileEntry = require.resolve("proper-lockfile");
    fs.writeFileSync(
      writerScript,
      `
const fs = require("node:fs");
const lockfile = require(${JSON.stringify(lockfileEntry)});

const sessionPath = process.argv[2];
const handlerId = process.argv[3];

const sleepSync = (ms) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

let release;
for (let attempt = 0; attempt < 20; attempt += 1) {
  try {
    release = lockfile.lockSync(sessionPath, { stale: 15000, realpath: false });
    break;
  } catch {
    sleepSync(Math.min(50 * 1.5 ** attempt, 500));
  }
}
if (!release) {
  console.error("lock failed");
  process.exit(1);
}

try {
  const prev = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  const next = {
    revision: prev.revision + 1,
    state: {
      ...prev.state,
      flattenHandlers: [
      ...prev.state.flattenHandlers,
      {
        id: handlerId,
        path: "/" + handlerId,
        method: "get",
        behavior: "default",
        type: "default",
      },
      ],
    },
    owner: prev.owner,
  };
  const tmpPath = sessionPath + "." + process.pid + "." + Date.now() + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(next, null, 2) + "\\n", "utf8");
  fs.renameSync(tmpPath, sessionPath);
} finally {
  release();
}
`,
      "utf8"
    );

    const { spawn } = await import("node:child_process");
    const writerCount = 12;
    const children = Array.from({ length: writerCount }, (_, i) =>
      new Promise<void>((resolve, reject) => {
        const child = spawn(
          process.execPath,
          [writerScript, sessionPath, `p-${i}`],
          { stdio: ["ignore", "ignore", "pipe"] }
        );
        let stderr = "";
        child.stderr.on("data", (chunk) => {
          stderr += String(chunk);
        });
        child.on("exit", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`writer exited ${code}: ${stderr}`));
        });
      })
    );

    await Promise.all(children);

    const final = await readSnapshot(sessionPath);
    expect(final?.revision).toBe(writerCount);
    expect(final?.state.flattenHandlers).toHaveLength(writerCount);
    expect(final?.state.flattenHandlers.map((h) => h.id).sort()).toEqual(
      Array.from({ length: writerCount }, (_, i) => `p-${i}`).sort()
    );
  });

  it("throws on corrupt snapshot JSON", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    fs.writeFileSync(sessionPath, "{not-json", "utf8");
    await expect(readSnapshot(sessionPath)).rejects.toThrow(/Invalid JSON/);
  });

  it("preserves pendingReset across unrelated bumps", () => {
    const withReset = bumpSnapshot(createEmptySnapshot(), {
      flattenHandlers: [],
      pendingReset: true,
    });
    expect(withReset.state.pendingReset).toBe(true);

    const preserved = bumpSnapshot(withReset, {
      flattenHandlers: [
        {
          id: "a",
          path: "/a",
          method: HttpMethod.GET,
          behavior: HttpHandlerBehavior.DEFAULT,
          type: "default",
        },
      ],
    });
    expect(preserved.state.pendingReset).toBe(true);

    const cleared = bumpSnapshot(preserved, {
      flattenHandlers: preserved.state.flattenHandlers,
      pendingReset: false,
    });
    expect(cleared.state.pendingReset).toBeUndefined();
  });

  it("handles snapshot mutation lookup, removal, reset, and empty-file edges", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    await expect(readSnapshotOrEmpty(sessionPath)).resolves.toEqual(createEmptySnapshot());
    await expect(readSnapshot(sessionPath)).resolves.toBeNull();
    await writeSnapshot(sessionPath, bumpSnapshot(createEmptySnapshot(), {
      flattenHandlers: [{ id: "code", path: "/code", method: HttpMethod.GET, behavior: HttpHandlerBehavior.DEFAULT, type: "default" }],
    }));
    await expect(listSnapshotHandlers(sessionPath)).resolves.toHaveLength(1);
    await expect(getSnapshotHandler(sessionPath, "missing")).resolves.toBeUndefined();
    await expect(setSnapshotBehavior(sessionPath, "missing", HttpHandlerBehavior.DELAY)).rejects.toThrow("Handler not found");
    await expect(setSnapshotCustomResponse(sessionPath, "missing", { status: 200 })).rejects.toThrow("Handler not found");
    await expect(removeSnapshotTempHandler(sessionPath, "missing")).rejects.toThrow("Handler not found");
    await expect(removeSnapshotTempHandler(sessionPath, "code")).rejects.toThrow("cannot be deleted");
    const temp = await addSnapshotTempHandler(sessionPath, { path: "/temp", method: HttpMethod.POST, contentType: MimeType.TEXT_PLAIN, status: StringHttpStatusCode.OK, response: "ok" });
    const tempId = temp.state.flattenHandlers.at(-1)!.id;
    await expect(addSnapshotTempHandler(sessionPath, { path: "/temp", method: HttpMethod.POST, contentType: MimeType.TEXT_PLAIN, status: StringHttpStatusCode.OK, response: "ok" })).rejects.toThrow("Duplicate handler");
    await expect(removeSnapshotTempHandler(sessionPath, tempId)).resolves.toMatchObject({
      state: { flattenHandlers: [expect.objectContaining({ id: "code" })] },
    });
    await expect(requestSnapshotReset(sessionPath)).resolves.toMatchObject({
      state: { pendingReset: true },
    });
  });

  it("rejects empty and schema-invalid snapshot files", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    fs.writeFileSync(sessionPath, "   ");
    await expect(readSnapshot(sessionPath)).rejects.toThrow("empty");
    fs.writeFileSync(sessionPath, JSON.stringify({ revision: "bad" }));
    await expect(readSnapshot(sessionPath)).rejects.toThrow("Invalid session snapshot schema");
  });

  it("preserves current default handlers missing from snapshot", () => {
    const runtime = {
      use: () => undefined,
      resetHandlers: () => undefined,
      listHandlers: () => [],
    };

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
    const handlerA = { info: { method: "GET", path: "/a" } } as any;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
    const handlerB = { info: { method: "GET", path: "/b" } } as any;

    const current: FlattenHandler[] = [
      {
        id: "a",
        path: "/a",
        method: HttpMethod.GET,
        behavior: HttpHandlerBehavior.DEFAULT,
        type: "default",
        handler: handlerA,
      },
      {
        id: "b",
        path: "/b",
        method: HttpMethod.GET,
        behavior: HttpHandlerBehavior.DEFAULT,
        type: "default",
        handler: handlerB,
      },
    ];

    const next = applySnapshotToRuntime({
      runtime,
      current,
      snapshot: {
        revision: 2,
        state: { flattenHandlers: [
          {
            id: "a",
            path: "/a",
            method: HttpMethod.GET,
            behavior: HttpHandlerBehavior.CUSTOM_RESPONSE,
            type: "default",
            customResponse: {
              body: "snapshot custom",
              headers: { "X-Source": "snapshot" },
              status: 202,
            },
          },
        ] },
        owner: { pid: 1 },
      },
    });

    expect(next.map((h) => h.id).sort()).toEqual(["a", "b"]);
    expect(next.find((h) => h.id === "a")?.behavior).toBe(
      HttpHandlerBehavior.CUSTOM_RESPONSE
    );
    expect(next.find((h) => h.id === "a")?.customResponse).toEqual({
      body: "snapshot custom",
      headers: { "X-Source": "snapshot" },
      status: 202,
    });
  });

  it("uses a custom response for a temp handler restored from a snapshot", async () => {
    const runtime = {
      use: () => undefined,
      resetHandlers: () => undefined,
      listHandlers: () => [],
    };
    const path = "/snapshot-temp";
    const method = HttpMethod.GET;
    const id = getRowId({ path, method });

    const next = applySnapshotToRuntime({
      runtime,
      current: [],
      snapshot: {
        revision: 1,
        state: { flattenHandlers: [
          {
            id,
            path,
            method,
            behavior: HttpHandlerBehavior.CUSTOM_RESPONSE,
            type: "temp",
            tempInput: {
              path,
              method,
              contentType: MimeType.APPLICATION_JSON,
              status: StringHttpStatusCode.OK,
              response: '{"original":true}',
            },
            customResponse: {
              body: "restored custom response",
              headers: { "X-Source": "snapshot" },
              status: 202,
            },
          },
        ] },
        owner: { pid: 1 },
      },
    });

    const handler = next[0]?.handler;
    if (!handler) throw new Error("Expected restored temp handler");
    const result = await handler.resolver({
      request: new Request(`http://localhost${path}`, { method: "GET" }),
      requestId: "1",
      params: {},
      cookies: {},
    });

    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(result.status).toBe(202);
    expect(result.headers.get("X-Source")).toBe("snapshot");
    expect(await result.text()).toBe("restored custom response");
  });
});
