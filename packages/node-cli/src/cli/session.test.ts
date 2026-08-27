import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  addSnapshotTempHandler: vi.fn(),
  getSnapshotHandler: vi.fn(),
  listSnapshotHandlers: vi.fn(),
  readSnapshotOrEmpty: vi.fn(),
  removeSnapshotTempHandler: vi.fn(),
  requestSnapshotReset: vi.fn(),
  setSnapshotBehavior: vi.fn(),
  setSnapshotCustomResponse: vi.fn(),
  addSnapshotWebSocketEndpoint: vi.fn(),
  addSnapshotWebSocketListener: vi.fn(),
  getSnapshotWebSocketEndpoint: vi.fn(),
  listSnapshotWebSocketEndpoints: vi.fn(),
  removeSnapshotWebSocketEndpoint: vi.fn(),
  removeSnapshotWebSocketListener: vi.fn(),
  setSnapshotWebSocketEndpointEnabled: vi.fn(),
  setSnapshotWebSocketListenerBehavior: vi.fn(),
  setSnapshotWebSocketListenerCustomResponse: vi.fn(),
  setSnapshotWebSocketListenerEnabled: vi.fn(),
  setSnapshotWebSocketListenerResponse: vi.fn(),
  setSnapshotWebSocketListenerEventBehavior: vi.fn(),
  setSnapshotWebSocketListenerEventCustomResponse: vi.fn(),
  setSnapshotWebSocketListenerEventResponse: vi.fn(),
}));
vi.mock("@msw-dev-tool/core/node/internal", () => api);
import { FileSnapshotCliSession } from "./session";

const snapshot = (handlers = [{ id: "a" }]) => ({
  revision: 2,
  state: { flattenHandlers: handlers, pendingReset: false },
});
const wsEndpoint = {
  endpointId: "ws-1",
  info: {
    id: "ws-1",
    kind: "websocket" as const,
    endpoint: "ws://example.test/chat",
    operation: "endpoint",
    source: "temp" as const,
  },
  matcher: { kind: "string" as const, value: "ws://example.test/chat" },
  enabled: true,
  listeners: [],
};
const wsListener = {
  info: {
    id: "ws-1:message:0",
    kind: "websocket" as const,
    endpoint: "ws://example.test/chat",
    operation: "message",
    source: "temp" as const,
  },
  endpointId: "ws-1",
  event: "message" as const,
  enabled: true,
  behavior: { preset: "send" },
};
const wsSnapshot = (endpoint = wsEndpoint) => ({
  revision: 2,
  state: { flattenHandlers: [], webSocket: [endpoint] },
});
const wsEventBranch = {
  eventType: "chat/message",
  enabled: true,
  behavior: { preset: "default" },
};

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
    await expect(session.describe()).resolves.toEqual({
      revision: 2,
      pendingReset: false,
      handlerCount: 1,
    });
    await expect(session.list()).resolves.toEqual([{ id: "a" }]);
    await expect(session.get("a")).resolves.toEqual({ id: "a" });
    const calls = [
      session.setBehavior("a", "delay"),
      session.setCustomResponse("a", {
        status: "200",
        contentType: "text/plain",
        response: "ok",
      }),
      session.addTemp({ path: "/t", method: "get", contentType: "text/plain", status: "200" }),
      session.removeTemp("a"),
      session.reset(),
    ];
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
    api.setSnapshotWebSocketListenerCustomResponse.mockReturnValue(
      wsSnapshot({
        ...endpointWithListener,
        listeners: [
          { ...wsListener, customResponse: { type: "send", dataType: "string", value: "hello" } },
        ],
      }),
    );
    api.setSnapshotWebSocketListenerResponse.mockReturnValue(
      wsSnapshot({
        ...endpointWithListener,
        listeners: [
          { ...wsListener, response: { type: "send", dataType: "string", value: "default" } },
        ],
      }),
    );
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
      session.setWebSocketListenerCustomResponse(wsListener.info.id, {
        type: "send",
        dataType: "string",
        value: "hello",
      }),
      session.addWebSocketListener({
        endpointId: "ws-1",
        behavior: { preset: "default" },
        response: {
          type: "send",
          dataType: "string",
          value: "default",
          delay: 300,
          repeat: { interval: 500, repetitions: 3 },
        },
        customResponse: { type: "send", dataType: "string", value: "custom", delay: 100 },
      }),
      session.setWebSocketListenerResponse(wsListener.info.id, {
        type: "send",
        dataType: "string",
        value: "default",
        delay: 300,
        repeat: { interval: 500, repetitions: "Infinity" },
      }),
    ];
    await vi.advanceTimersByTimeAsync(300);
    await expect(Promise.all(calls)).resolves.toHaveLength(10);
    expect(api.addSnapshotWebSocketEndpoint).toHaveBeenCalledWith(
      "/tmp/session.json",
      wsEndpoint.matcher,
    );
    expect(api.setSnapshotWebSocketListenerBehavior).toHaveBeenCalledWith(
      "/tmp/session.json",
      wsListener.info.id,
      { preset: "close" },
    );
    expect(api.addSnapshotWebSocketListener).toHaveBeenCalledWith("/tmp/session.json", "ws-1", {
      behavior: { preset: "default" },
      response: {
        type: "send",
        dataType: "string",
        value: "default",
        delay: 300,
        repeat: { interval: 500, repetitions: 3 },
      },
      customResponse: { type: "send", dataType: "string", value: "custom", delay: 100 },
    });
    expect(api.setSnapshotWebSocketListenerResponse).toHaveBeenCalledWith(
      "/tmp/session.json",
      wsListener.info.id,
      {
        type: "send",
        dataType: "string",
        value: "default",
        delay: 300,
        repeat: { interval: 500, repetitions: "Infinity" },
      },
    );
    vi.useRealTimers();
  });

  it("adapts every logical WebSocket event branch mutation", async () => {
    vi.useFakeTimers();
    const listenerWithBranch = { ...wsListener, eventBranches: [wsEventBranch] };
    const endpointWithBranch = { ...wsEndpoint, listeners: [listenerWithBranch] };
    api.setSnapshotWebSocketListenerEventBehavior.mockReturnValue(wsSnapshot(endpointWithBranch));
    api.setSnapshotWebSocketListenerEventCustomResponse.mockReturnValue(
      wsSnapshot({
        ...wsEndpoint,
        listeners: [
          {
            ...listenerWithBranch,
            eventBranches: [
              {
                ...wsEventBranch,
                customResponse: { type: "send", dataType: "string", value: "custom" },
              },
            ],
          },
        ],
      }),
    );
    api.setSnapshotWebSocketListenerEventResponse.mockReturnValue(
      wsSnapshot({
        ...wsEndpoint,
        listeners: [
          {
            ...listenerWithBranch,
            eventBranches: [
              {
                ...wsEventBranch,
                response: { type: "send", dataType: "string", value: "response" },
              },
            ],
          },
        ],
      }),
    );
    const session = new FileSnapshotCliSession("/tmp/session.json");
    const calls = [
      session.setWebSocketListenerEventBehavior(wsListener.info.id, "chat/message", {
        preset: "echo",
      }),
      session.setWebSocketListenerEventCustomResponse(wsListener.info.id, "chat/message", {
        type: "send",
        dataType: "string",
        value: "custom",
      }),
      session.setWebSocketListenerEventResponse(wsListener.info.id, "chat/message", {
        type: "send",
        dataType: "string",
        value: "response",
      }),
    ];
    await vi.advanceTimersByTimeAsync(300);
    await expect(Promise.all(calls)).resolves.toEqual([
      expect.objectContaining({ eventBranch: wsEventBranch }),
      expect.objectContaining({
        eventBranch: expect.objectContaining({
          customResponse: { type: "send", dataType: "string", value: "custom" },
        }),
      }),
      expect.objectContaining({
        eventBranch: expect.objectContaining({
          response: { type: "send", dataType: "string", value: "response" },
        }),
      }),
    ]);
    expect(api.setSnapshotWebSocketListenerEventBehavior).toHaveBeenCalledWith(
      "/tmp/session.json",
      wsListener.info.id,
      "chat/message",
      { preset: "echo" },
    );
    vi.useRealTimers();
  });

  it("reports mutations that cannot find the resulting handler", async () => {
    vi.useFakeTimers();
    api.setSnapshotBehavior.mockReturnValue(snapshot([]));
    api.addSnapshotTempHandler.mockReturnValue(snapshot([]));
    const session = new FileSnapshotCliSession("/tmp/session.json");
    const missing = expect(session.setBehavior("a", "delay")).rejects.toThrow("Handler not found");
    const empty = expect(
      session.addTemp({ path: "/t", method: "get", contentType: "text/plain", status: "200" }),
    ).rejects.toThrow("Temporary handler was not added");
    await vi.advanceTimersByTimeAsync(300);
    await missing;
    await empty;
    vi.useRealTimers();
  });
});
