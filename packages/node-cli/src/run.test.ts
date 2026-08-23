import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSessionPathForPid } from "@msw-dev-tool/core/node/internal";
import { runCli } from "../src/run";

const tempDirs: string[] = [];
const originalCwd = process.cwd();

const createSessionFile = (pid = 4182) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "msw-dev-tool-cli-"));
  tempDirs.push(dir);
  process.chdir(dir);
  const sessionPath = getSessionPathForPid(pid, dir);
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  fs.writeFileSync(
    sessionPath,
    JSON.stringify({
      revision: 0,
      owner: { pid },
      state: {
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
    }),
  );
  return { pid, sessionPath };
};

const runWithJsonOutput = async (argv: string[]) => {
  const logs: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array) => {
    logs.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  try {
    await runCli(argv);
  } finally {
    process.stdout.write = originalWrite;
  }
  return JSON.parse(logs.join(""));
};

afterEach(() => {
  vi.useRealTimers();
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("node-cli", () => {
  it("prints help and rejects unknown commands", async () => {
    const output: string[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array) => {
      output.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    try {
      await runCli([]);
      await runCli(["--help"]);
    } finally {
      process.stdout.write = originalWrite;
    }
    expect(output.join("")).toContain("Session discovery");
    await expect(runCli(["unknown"])).rejects.toThrow("Unknown command");
  });
  it("lists PID sessions in the current working directory", async () => {
    createSessionFile(4182);
    const secondPath = getSessionPathForPid(4217);
    fs.mkdirSync(path.dirname(secondPath), { recursive: true });
    fs.writeFileSync(
      secondPath,
      JSON.stringify({ revision: 0, owner: { pid: 4217 }, state: { flattenHandlers: [] } }),
    );
    await expect(runWithJsonOutput(["sessions"])).resolves.toEqual({
      ok: true,
      sessions: [{ pid: 4182 }, { pid: 4217 }],
    });
  });

  it("automatically selects the only session and applies a mutation", async () => {
    const { pid } = createSessionFile();
    const id = JSON.stringify({ path: "/api/items", method: "get" });
    const payload = await runWithJsonOutput(["set-behavior", id, "delay"]);
    expect(payload).toMatchObject({ ok: true, pid, revision: 1, handler: { behavior: "delay" } });
  });

  it("requires --pid when multiple sessions exist and selects the requested PID", async () => {
    createSessionFile(4182);
    const secondPath = getSessionPathForPid(4217);
    fs.writeFileSync(
      secondPath,
      JSON.stringify({ revision: 0, owner: { pid: 4217 }, state: { flattenHandlers: [] } }),
    );
    await expect(runCli(["list"])).rejects.toThrow(/Multiple msw-dev-tool sessions/);
    await expect(runWithJsonOutput(["--pid", "4217", "list"])).resolves.toMatchObject({
      ok: true,
      pid: 4217,
      handlers: [],
    });
  });

  it("rejects malformed commands before mutating a selected session", async () => {
    const { pid } = createSessionFile();
    await expect(runCli(["--pid", String(pid), "get"])).rejects.toThrow("Usage: get <id>");
    await expect(runCli(["--pid", "not-a-pid", "list"])).rejects.toThrow(
      "--pid must be a numeric process ID",
    );
    await expect(runCli(["--pid", "999999", "list"])).rejects.toThrow(
      "No msw-dev-tool session found for PID 999999",
    );
  });

  it("reports that no session is available when discovery is empty", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "msw-dev-tool-cli-empty-"));
    tempDirs.push(dir);
    process.chdir(dir);
    await expect(runCli(["list"])).rejects.toThrow("No msw-dev-tool sessions found");
  });
});
