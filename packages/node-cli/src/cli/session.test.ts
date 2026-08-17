import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  addSnapshotTempHandler: vi.fn(), getSnapshotHandler: vi.fn(), listSnapshotHandlers: vi.fn(), readSessionSnapshot: vi.fn(),
  removeSnapshotTempHandler: vi.fn(), requestSnapshotReset: vi.fn(), setSnapshotBehavior: vi.fn(), setSnapshotCustomResponse: vi.fn(),
}));
vi.mock("@msw-dev-tool/core/node/internal", () => api);
import { FileSnapshotCliSession } from "./session";

const snapshot = (handlers = [{ id: "a" }]) => ({ revision: 2, state: { flattenHandlers: handlers, pendingReset: false } });

describe("FileSnapshotCliSession", () => {
  it("adapts reads and every mutation result", async () => {
    vi.useFakeTimers();
    api.readSessionSnapshot.mockReturnValue(snapshot());
    api.listSnapshotHandlers.mockReturnValue([{ id: "a" }]);
    api.getSnapshotHandler.mockReturnValue({ id: "a" });
    api.setSnapshotBehavior.mockReturnValue(snapshot());
    api.setSnapshotCustomResponse.mockReturnValue(snapshot());
    api.addSnapshotTempHandler.mockReturnValue(snapshot([{ id: "a" }, { id: "temp" }]));
    api.removeSnapshotTempHandler.mockReturnValue(snapshot());
    const session = new FileSnapshotCliSession("/tmp/session.json");
    await expect(session.describe()).resolves.toEqual({ revision: 2, pendingReset: false, handlerCount: 1 });
    await expect(session.list()).resolves.toEqual([{ id: "a" }]);
    await expect(session.get("a")).resolves.toEqual({ id: "a" });
    const calls = [session.setBehavior("a", "delay"), session.setCustomResponse("a", { status: 200 }), session.addTemp({ path: "/t", method: "get", contentType: "text/plain", status: "200" }), session.removeTemp("a"), session.reset()];
    await vi.advanceTimersByTimeAsync(300);
    await expect(Promise.all(calls)).resolves.toHaveLength(5);
    expect(api.requestSnapshotReset).toHaveBeenCalledWith("/tmp/session.json");
    vi.useRealTimers();
  });

  it("reports mutations that cannot find the resulting handler", async () => {
    vi.useFakeTimers();
    api.setSnapshotBehavior.mockReturnValue(snapshot([]));
    api.addSnapshotTempHandler.mockReturnValue(snapshot([]));
    const session = new FileSnapshotCliSession("/tmp/session.json");
    const missing = expect(session.setBehavior("a", "delay")).rejects.toThrow("Handler not found");
    const empty = expect(session.addTemp({ path: "/t", method: "get", contentType: "text/plain", status: "200" })).rejects.toThrow("Temporary handler was not added");
    await vi.advanceTimersByTimeAsync(300);
    await missing;
    await empty;
    vi.useRealTimers();
  });
});
