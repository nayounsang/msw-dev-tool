import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/run";

const tempDirs: string[] = [];

const createSessionFile = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "msw-dev-tool-cli-"));
  tempDirs.push(dir);
  const sessionPath = path.join(dir, "session.json");
  fs.writeFileSync(
    sessionPath,
    JSON.stringify(
      {
        revision: 0,
        flattenHandlers: [
          {
            id: JSON.stringify({ path: "/api/items", method: "get" }),
            path: "/api/items",
            method: "get",
            behavior: "default",
            type: "default",
          },
        ],
      },
      null,
      2
    )
  );
  return sessionPath;
};

const runWithJsonOutput = async (argv: string[], settle = false) => {
  const logs: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array) => {
    logs.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;

  try {
    const running = runCli(argv);
    if (settle) await vi.advanceTimersByTimeAsync(300);
    await running;
  } finally {
    process.stdout.write = originalWrite;
  }

  return JSON.parse(logs.join(""));
};

afterEach(() => {
  vi.useRealTimers();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("node-cli", () => {
  it("lists handlers from a session snapshot", async () => {
    const sessionPath = createSessionFile();
    const payload = await runWithJsonOutput(["--session", sessionPath, "list"]);
    expect(payload.ok).toBe(true);
    expect(payload.handlers).toHaveLength(1);
    expect(payload.handlers[0].path).toBe("/api/items");
  });

  it("sets behavior in the snapshot", async () => {
    const sessionPath = createSessionFile();
    const id = JSON.stringify({ path: "/api/items", method: "get" });
    vi.useFakeTimers();
    const payload = await runWithJsonOutput([
      "--session",
      sessionPath,
      "set-behavior",
      id,
      "delay",
    ], true);
    vi.useRealTimers();
    expect(payload.ok).toBe(true);
    expect(payload.handler.behavior).toBe("delay");
    expect(payload.revision).toBe(1);
  });

  it("reports session metadata and returns a handler by id", async () => {
    const sessionPath = createSessionFile();
    const id = JSON.stringify({ path: "/api/items", method: "get" });

    const session = await runWithJsonOutput(["--session", sessionPath, "session"]);
    const get = await runWithJsonOutput(["--session", sessionPath, "get", id]);

    expect(session).toMatchObject({
      ok: true,
      sessionPath,
      revision: 0,
      handlerCount: 1,
    });
    expect(get).toMatchObject({ ok: true, sessionPath, handler: { id } });
  });

  it("adds, removes, and resets handlers through the command registry", async () => {
    const sessionPath = createSessionFile();
    const data = JSON.stringify({
      path: "/api/temp",
      method: "get",
      contentType: "application/json",
      status: "200",
      response: '{"ok":true}',
    });

    vi.useFakeTimers();
    const added = await runWithJsonOutput([
      "--session",
      sessionPath,
      "add-temp",
      "--json",
      data,
    ], true);
    const tempId = added.handler.id;
    const removed = await runWithJsonOutput([
      "--session",
      sessionPath,
      "remove-temp",
      tempId,
    ], true);
    const reset = await runWithJsonOutput(["--session", sessionPath, "reset"], true);
    vi.useRealTimers();

    expect(added).toMatchObject({ ok: true, handler: { type: "temp" } });
    expect(removed).toMatchObject({ ok: true, revision: 2 });
    expect(reset).toMatchObject({ ok: true, revision: 3, pendingReset: true });
  });

  it("rejects malformed command input before mutating the snapshot", async () => {
    const sessionPath = createSessionFile();

    await expect(runCli(["--session", sessionPath, "get"])).rejects.toThrow(
      "Usage: get <id>"
    );
    await expect(
      runCli(["--session", sessionPath, "set-behavior", "missing", "unknown"])
    ).rejects.toThrow(/Unknown behavior/);
    await expect(
      runCli(["--session", sessionPath, "add-temp", "--json", "{"])
    ).rejects.toThrow(SyntaxError);
    await expect(runCli(["--session", sessionPath, "unknown-command"])).rejects.toThrow(
      /Unknown command/
    );
  });
});
