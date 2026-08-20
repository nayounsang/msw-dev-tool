import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  addSnapshotTempHandler: vi.fn(), getSnapshotHandler: vi.fn(), listSnapshotHandlers: vi.fn(), readSnapshotOrEmpty: vi.fn(),
  removeSnapshotTempHandler: vi.fn(), requestSnapshotReset: vi.fn(), setSnapshotBehavior: vi.fn(), setSnapshotCustomResponse: vi.fn(),
  addSnapshotWebSocketEndpoint: vi.fn(), addSnapshotWebSocketListener: vi.fn(), getSnapshotWebSocketEndpoint: vi.fn(), listSnapshotWebSocketEndpoints: vi.fn(),
  removeSnapshotWebSocketEndpoint: vi.fn(), removeSnapshotWebSocketListener: vi.fn(), setSnapshotWebSocketEndpointEnabled: vi.fn(),
  setSnapshotWebSocketListenerBehavior: vi.fn(), setSnapshotWebSocketListenerEnabled: vi.fn(),
}));
vi.mock("@msw-dev-tool/core/node/internal", () => api);
import { FileSnapshotCliSession } from "./session";

const snapshot = (handlers = [{ id: "a" }]) => ({ revision: 2, state: { flattenHandlers: handlers, pendingReset: false } });
const wsEndpoint = {
  endpointId: "ws-1",
  info: { id: "ws-1", kind: "websocket" as const, endpoint: "ws://example.test/chat", operation: "endpoint", source: "temp" as const },
  matcher: { kind: "string" as const, value: "ws://example.test/chat" },
  enabled: true,
  listeners: [],
};
const wsListener = {
  info: { id: "ws-1:message:0", kind: "websocket" as const, endpoint: "ws://example.test/chat", operation: "message", source: "temp" as const },
  endpointId: "ws-1", event: "message" as const, enabled: true, behavior: { preset: "send" },
};
const wsSnapshot = (endpoint = wsEndpoint) => ({ revision: 2, state: { flattenHandlers: [], webSocket: [endpoint] } });

describe("FileSnapshotCliSession", () => {
  it("adapts reads and every mutation result", async () => {
    vi.useFakeTimers();
    api.readSnapshotOrEmpty.mockReturnValue(snapshot());
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

  it("adapts all WebSocket reads and mutations", async () => {
    vi.useFakeTimers();
    const endpointWithListener = { ...wsEndpoint, listeners: [wsListener] };
    api.listSnapshotWebSocketEndpoints.mockResolvedValue([wsEndpoint]);
    api.getSnapshotWebSocketEndpoint.mockResolvedValue(wsEndpoint);
    api.addSnapshotWebSocketEndpoint.mockReturnValue(wsSnapshot());
    api.removeSnapshotWebSocketEndpoint.mockReturnValue(wsSnapshot());
    api.setSnapshotWebSocketEndpointEnabled.mockReturnValue(wsSnapshot());
    api.addSnapshotWebSocketListener.mockReturnValue(wsSnapshot(endpointWithListener));
    api.removeSnapshotWebSocketListener.mockReturnValue(wsSnapshot());
    api.setSnapshotWebSocketListenerEnabled.mockReturnValue(wsSnapshot(endpointWithListener));
    api.setSnapshotWebSocketListenerBehavior.mockReturnValue(wsSnapshot(endpointWithListener));
    const session = new FileSnapshotCliSession("/tmp/session.json");
    await expect(session.listWebSocket()).resolves.toEqual([wsEndpoint]);
    await expect(session.getWebSocketEndpoint("ws-1")).resolves.toEqual(wsEndpoint);
    const calls = [
      session.addWebSocketEndpoint(wsEndpoint.matcher),
      session.removeWebSocketEndpoint("ws-1"),
      session.setWebSocketEndpointEnabled("ws-1", false),
      session.addWebSocketListener("ws-1", { preset: "send" }),
      session.removeWebSocketListener(wsListener.info.id),
      session.setWebSocketListenerEnabled(wsListener.info.id, false),
      session.setWebSocketListenerBehavior(wsListener.info.id, { preset: "close" }),
    ];
    await vi.advanceTimersByTimeAsync(300);
    await expect(Promise.all(calls)).resolves.toHaveLength(7);
    expect(api.addSnapshotWebSocketEndpoint).toHaveBeenCalledWith("/tmp/session.json", wsEndpoint.matcher);
    expect(api.setSnapshotWebSocketListenerBehavior).toHaveBeenCalledWith("/tmp/session.json", wsListener.info.id, { preset: "close" });
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
