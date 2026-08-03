import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FlattenHandler, HttpHandlerBehavior, HttpMethod } from "../../shared/types";
import { readSnapshot, writeSnapshot } from "./file";
import { bumpSnapshot } from "./serialize";
import { SessionController } from "./controller";
import { SESSION_ENV_KEY } from "./types";

const tempDirs: string[] = [];

const createTempSessionPath = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "msw-session-controller-"));
  tempDirs.push(dir);
  return path.join(dir, "session.json");
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
  delete process.env[SESSION_ENV_KEY];
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("SessionController", () => {
  it("seeds a session and applies each newer non-reset snapshot once", () => {
    const sessionPath = createTempSessionPath();
    process.env[SESSION_ENV_KEY] = sessionPath;
    const onSnapshot = vi.fn();
    const controller = new SessionController({
      onSnapshot,
      onReset: () => [createFlattenHandler()],
    });

    controller.start([createFlattenHandler()]);
    const seeded = readSnapshot(sessionPath)!;
    expect(seeded.revision).toBe(1);
    expect(seeded.flattenHandlers).toHaveLength(1);

    const next = bumpSnapshot(seeded, {
      flattenHandlers: seeded.flattenHandlers.map((handler) => ({
        ...handler,
        behavior: HttpHandlerBehavior.DELAY,
      })),
    });
    writeSnapshot(sessionPath, next);

    controller.sync();
    controller.sync();

    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(onSnapshot).toHaveBeenCalledWith(next);
    controller.dispose();
  });

  it("acknowledges reset and removes session artifacts on dispose", () => {
    const sessionPath = createTempSessionPath();
    process.env[SESSION_ENV_KEY] = sessionPath;
    const onReset = vi.fn(() => [createFlattenHandler()]);
    const controller = new SessionController({ onSnapshot: vi.fn(), onReset });

    controller.start([createFlattenHandler()]);
    const resetRequest = bumpSnapshot(readSnapshot(sessionPath)!, {
      pendingReset: true,
    });
    writeSnapshot(sessionPath, resetRequest);

    controller.sync();

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(readSnapshot(sessionPath)?.pendingReset).toBeUndefined();
    controller.dispose();
    expect(fs.existsSync(sessionPath)).toBe(false);
    expect(fs.existsSync(`${sessionPath}.lock`)).toBe(false);
  });
});
