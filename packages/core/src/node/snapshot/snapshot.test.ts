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
  listSnapshotHandlers,
  readSnapshotOrEmpty,
  getSessionPathForPid,
  listSessionPids,
  applySnapshotToRuntime,
} from "./index";
import {
  HttpHandlerBehavior,
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "../../shared/types";
import { FlattenHandler } from "../../shared/types";
import { getRowId } from "../../shared/utils/store";

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
  it("writes and reads snapshots atomically", () => {
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
    writeSnapshot(sessionPath, snap);
    expect(readSnapshot(sessionPath)).toEqual(snap);
  });

  it("bumps revision on setSnapshotBehavior", () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    writeSnapshot(
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

    const next = setSnapshotBehavior(
      sessionPath,
      JSON.stringify({ path: "/api", method: "get" }),
      HttpHandlerBehavior.DELAY
    );
    expect(next.revision).toBe(2);
    expect(next.state.flattenHandlers[0]?.behavior).toBe(HttpHandlerBehavior.DELAY);
  });

  it("stores a custom response without changing behavior", () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    writeSnapshot(sessionPath, bumpSnapshot(createEmptySnapshot(), {
      flattenHandlers: [{ id: "a", path: "/api", method: HttpMethod.GET, behavior: HttpHandlerBehavior.DEFAULT, type: "default" }],
    }));

    const next = setSnapshotCustomResponse(sessionPath, "a", {
      status: 201,
      body: "created",
      headers: { "X-Created": "yes" },
    });

    expect(next).toMatchObject({ revision: 2, state: { flattenHandlers: [{ behavior: HttpHandlerBehavior.DEFAULT, customResponse: { status: 201, body: "created" } }] } });
  });

  it("adds temp handlers with tempInput", () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    writeSnapshot(sessionPath, createEmptySnapshot());

    const next = addSnapshotTempHandler(sessionPath, {
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

  it("uses PID-named session files in the caller cwd", () => {
    const dir = makeTempDir();
    const sessionPath = getSessionPathForPid(4182, dir);
    writeSnapshot(sessionPath, createEmptySnapshot());
    expect(sessionPath).toBe(path.join(dir, ".msw-dev-tool", "sessions", "4182.json"));
    expect(listSessionPids(dir)).toEqual([4182]);
  });

  it("applies sequential locked mutations without lost updates", () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    writeSnapshot(sessionPath, createEmptySnapshot());

    const writerCount = 20;
    for (let i = 0; i < writerCount; i += 1) {
      withLockedMutation(sessionPath, (prev) =>
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

    const final = readSnapshot(sessionPath);
    expect(final?.revision).toBe(writerCount);
    expect(final?.state.flattenHandlers).toHaveLength(writerCount);
    expect(final?.state.flattenHandlers.map((h) => h.id).sort()).toEqual(
      Array.from({ length: writerCount }, (_, i) => `h-${i}`).sort()
    );
  });

  it("serializes multi-process writers without lost updates", async () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    writeSnapshot(sessionPath, createEmptySnapshot());

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

    const final = readSnapshot(sessionPath);
    expect(final?.revision).toBe(writerCount);
    expect(final?.state.flattenHandlers).toHaveLength(writerCount);
    expect(final?.state.flattenHandlers.map((h) => h.id).sort()).toEqual(
      Array.from({ length: writerCount }, (_, i) => `p-${i}`).sort()
    );
  });

  it("throws on corrupt snapshot JSON", () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    fs.writeFileSync(sessionPath, "{not-json", "utf8");
    expect(() => readSnapshot(sessionPath)).toThrow(/Invalid JSON/);
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

  it("handles snapshot mutation lookup, removal, reset, and empty-file edges", () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    expect(readSnapshotOrEmpty(sessionPath)).toEqual(createEmptySnapshot());
    expect(readSnapshot(sessionPath)).toBeNull();
    writeSnapshot(sessionPath, bumpSnapshot(createEmptySnapshot(), {
      flattenHandlers: [{ id: "code", path: "/code", method: HttpMethod.GET, behavior: HttpHandlerBehavior.DEFAULT, type: "default" }],
    }));
    expect(listSnapshotHandlers(sessionPath)).toHaveLength(1);
    expect(getSnapshotHandler(sessionPath, "missing")).toBeUndefined();
    expect(() => setSnapshotBehavior(sessionPath, "missing", HttpHandlerBehavior.DELAY)).toThrow("Handler not found");
    expect(() => setSnapshotCustomResponse(sessionPath, "missing", { status: 200 })).toThrow("Handler not found");
    expect(() => removeSnapshotTempHandler(sessionPath, "missing")).toThrow("Handler not found");
    expect(() => removeSnapshotTempHandler(sessionPath, "code")).toThrow("cannot be deleted");
    const temp = addSnapshotTempHandler(sessionPath, { path: "/temp", method: HttpMethod.POST, contentType: MimeType.TEXT_PLAIN, status: StringHttpStatusCode.OK, response: "ok" });
    const tempId = temp.state.flattenHandlers.at(-1)!.id;
    expect(() => addSnapshotTempHandler(sessionPath, { path: "/temp", method: HttpMethod.POST, contentType: MimeType.TEXT_PLAIN, status: StringHttpStatusCode.OK, response: "ok" })).toThrow("Duplicate handler");
    expect(removeSnapshotTempHandler(sessionPath, tempId).state.flattenHandlers).toHaveLength(1);
    expect(requestSnapshotReset(sessionPath).state.pendingReset).toBe(true);
  });

  it("rejects empty and schema-invalid snapshot files", () => {
    const dir = makeTempDir();
    const sessionPath = path.join(dir, "session.json");
    fs.writeFileSync(sessionPath, "   ");
    expect(() => readSnapshot(sessionPath)).toThrow("empty");
    fs.writeFileSync(sessionPath, JSON.stringify({ revision: "bad" }));
    expect(() => readSnapshot(sessionPath)).toThrow("Invalid session snapshot schema");
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
