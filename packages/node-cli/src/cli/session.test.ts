import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  addSnapshotTempHandler: vi.fn(),
  getSnapshotHandler: vi.fn(),
  listSnapshotHandlers: vi.fn(),
  readSnapshotOrEmpty: vi.fn(),
  removeSnapshotTempHandler: vi.fn(),
  requestSnapshotReset: vi.fn(),
  setSnapshotBehavior: vi.fn(),
  setSnapshotHandlerEnabled: vi.fn(),
  setSnapshotMockEnabled: vi.fn(),
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
  setSnapshotWebSocketListenerEventEnabled: vi.fn(),
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

const sessionPath = "/tmp/session.json";

const settleMutation = async <Result>(mutation: Promise<Result>) => {
  await vi.advanceTimersByTimeAsync(300);
  return mutation;
};

const createHttpSession = () => {
  api.readSnapshotOrEmpty.mockReturnValue(snapshot());
  api.listSnapshotHandlers.mockReturnValue([{ id: "a" }]);
  api.getSnapshotHandler.mockReturnValue({ id: "a" });
  api.setSnapshotBehavior.mockReturnValue(snapshot());
  api.setSnapshotHandlerEnabled.mockReturnValue(snapshot([{ id: "a", enabled: false }]));
  api.setSnapshotMockEnabled.mockReturnValue({
    revision: 2,
    state: { flattenHandlers: [{ id: "a" }], pendingReset: false, mockEnabled: false },
  });
  api.setSnapshotCustomResponse.mockReturnValue(snapshot());
  api.addSnapshotTempHandler.mockReturnValue(snapshot([{ id: "a" }, { id: "temp" }]));
  api.removeSnapshotTempHandler.mockReturnValue(snapshot());
  return new FileSnapshotCliSession(sessionPath);
};

const createWebSocketSession = () => {
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
  return new FileSnapshotCliSession(sessionPath);
};

const createEventBranchSession = () => {
  const listenerWithBranch = { ...wsListener, eventBranches: [wsEventBranch] };
  const endpointWithBranch = { ...wsEndpoint, listeners: [listenerWithBranch] };
  api.setSnapshotWebSocketListenerEventBehavior.mockReturnValue(wsSnapshot(endpointWithBranch));
  api.setSnapshotWebSocketListenerEventEnabled.mockReturnValue(
    wsSnapshot({
      ...wsEndpoint,
      listeners: [{ ...listenerWithBranch, eventBranches: [{ ...wsEventBranch, enabled: false }] }],
    }),
  );
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
  return new FileSnapshotCliSession(sessionPath);
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("FileSnapshotCliSession", () => {
  it("returns the selected session metadata", async () => {
    const session = createHttpSession();

    await expect(session.describe()).resolves.toEqual({
      revision: 2,
      pendingReset: false,
      handlerCount: 1,
      mockEnabled: true,
    });
  });

  it("returns the HTTP handlers stored in the selected session", async () => {
    const session = createHttpSession();

    await expect(session.list()).resolves.toEqual([{ id: "a" }]);
  });

  it("returns an HTTP handler by ID", async () => {
    const session = createHttpSession();

    await expect(session.get("a")).resolves.toEqual({ id: "a" });
  });

  it("persists a handler behavior change in the session snapshot", async () => {
    vi.useFakeTimers();
    const session = createHttpSession();

    await expect(settleMutation(session.setBehavior("a", "delay"))).resolves.toMatchObject({
      handler: { id: "a" },
    });
    expect(api.setSnapshotBehavior).toHaveBeenCalledWith(sessionPath, "a", "delay");
  });

  it("persists a handler enabled-state change in the session snapshot", async () => {
    vi.useFakeTimers();
    const session = createHttpSession();

    await expect(settleMutation(session.setEnabled("a", false))).resolves.toMatchObject({
      handler: { id: "a", enabled: false },
    });
    expect(api.setSnapshotHandlerEnabled).toHaveBeenCalledWith(sessionPath, "a", false);
  });

  it("persists a global mock enabled-state change in the session snapshot", async () => {
    vi.useFakeTimers();
    const session = createHttpSession();

    await expect(settleMutation(session.setMockEnabled(false))).resolves.toMatchObject({
      mockEnabled: false,
    });
    expect(api.setSnapshotMockEnabled).toHaveBeenCalledWith(sessionPath, false);
  });

  it("stores a custom response on a handler in the session snapshot", async () => {
    vi.useFakeTimers();
    const session = createHttpSession();

    await expect(
      settleMutation(
        session.setCustomResponse("a", {
          status: "200",
          contentType: "text/plain",
          response: "ok",
        }),
      ),
    ).resolves.toMatchObject({ handler: { id: "a" } });
  });

  it("adds a temporary handler to the session snapshot", async () => {
    vi.useFakeTimers();
    const session = createHttpSession();

    await expect(
      settleMutation(
        session.addTemp({ path: "/t", method: "get", contentType: "text/plain", status: "200" }),
      ),
    ).resolves.toMatchObject({ handler: { id: "temp" } });
  });

  it("removes a temporary handler from the session snapshot", async () => {
    vi.useFakeTimers();
    const session = createHttpSession();

    await expect(settleMutation(session.removeTemp("a"))).resolves.toMatchObject({
      handlerCount: 1,
    });
  });

  it("requests a reset for the selected session snapshot", async () => {
    vi.useFakeTimers();
    const session = createHttpSession();

    await expect(settleMutation(session.reset())).resolves.toMatchObject({ handlerCount: 1 });
    expect(api.requestSnapshotReset).toHaveBeenCalledWith(sessionPath);
  });

  it("lists the WebSocket endpoints in a session snapshot", async () => {
    const session = createWebSocketSession();

    await expect(session.listWebSocket()).resolves.toEqual([wsEndpoint]);
  });

  it("returns a WebSocket endpoint from a session snapshot", async () => {
    const session = createWebSocketSession();

    await expect(session.getWebSocketEndpoint("ws-1")).resolves.toEqual(wsEndpoint);
  });

  it("adds a WebSocket endpoint to a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();

    await expect(
      settleMutation(session.addWebSocketEndpoint(wsEndpoint.matcher)),
    ).resolves.toBeDefined();
    expect(api.addSnapshotWebSocketEndpoint).toHaveBeenCalledWith(sessionPath, wsEndpoint.matcher);
  });

  it("removes a WebSocket endpoint from a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();

    await expect(settleMutation(session.removeWebSocketEndpoint("ws-1"))).resolves.toBeDefined();
    expect(api.removeSnapshotWebSocketEndpoint).toHaveBeenCalledWith(sessionPath, "ws-1");
  });

  it("changes a WebSocket endpoint enabled state in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();

    await expect(
      settleMutation(session.setWebSocketEndpointEnabled("ws-1", false)),
    ).resolves.toBeDefined();
    expect(api.setSnapshotWebSocketEndpointEnabled).toHaveBeenCalledWith(
      sessionPath,
      "ws-1",
      false,
    );
  });

  it("adds a WebSocket listener to a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();

    await expect(
      settleMutation(session.addWebSocketListener("ws-1", { preset: "send" })),
    ).resolves.toMatchObject({ listener: { info: { id: wsListener.info.id } } });
  });

  it("removes a WebSocket listener from a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();

    await expect(
      settleMutation(session.removeWebSocketListener(wsListener.info.id)),
    ).resolves.toBeDefined();
  });

  it("changes a WebSocket listener enabled state in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();

    await expect(
      settleMutation(session.setWebSocketListenerEnabled(wsListener.info.id, false)),
    ).resolves.toMatchObject({ listener: { info: { id: wsListener.info.id } } });
  });

  it("changes a WebSocket listener behavior in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();

    await expect(
      settleMutation(session.setWebSocketListenerBehavior(wsListener.info.id, { preset: "close" })),
    ).resolves.toMatchObject({ listener: { info: { id: wsListener.info.id } } });
    expect(api.setSnapshotWebSocketListenerBehavior).toHaveBeenCalledWith(
      sessionPath,
      wsListener.info.id,
      { preset: "close" },
    );
  });

  it("sets a custom response on a WebSocket listener in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();

    await expect(
      settleMutation(
        session.setWebSocketListenerCustomResponse(wsListener.info.id, {
          type: "send",
          dataType: "string",
          value: "hello",
        }),
      ),
    ).resolves.toMatchObject({ listener: { customResponse: { value: "hello" } } });
  });

  it("preserves a temporary listener response schedule in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();
    const input = {
      endpointId: "ws-1",
      behavior: { preset: "default" as const },
      response: {
        type: "send" as const,
        dataType: "string" as const,
        value: "default",
        delay: 300,
        repeat: { interval: 500, repetitions: 3 },
      },
      customResponse: {
        type: "send" as const,
        dataType: "string" as const,
        value: "custom",
        delay: 100,
      },
    };

    await expect(settleMutation(session.addWebSocketListener(input))).resolves.toBeDefined();
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
  });

  it("preserves a WebSocket listener response schedule in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createWebSocketSession();
    const response = {
      type: "send" as const,
      dataType: "string" as const,
      value: "default",
      delay: 300,
      repeat: { interval: 500, repetitions: "Infinity" as const },
    };

    await expect(
      settleMutation(session.setWebSocketListenerResponse(wsListener.info.id, response)),
    ).resolves.toMatchObject({ listener: { response: { value: "default" } } });
    expect(api.setSnapshotWebSocketListenerResponse).toHaveBeenCalledWith(
      sessionPath,
      wsListener.info.id,
      response,
    );
  });

  it("changes a logical WebSocket event branch enabled state in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createEventBranchSession();

    await expect(
      settleMutation(
        session.setWebSocketListenerEventEnabled(wsListener.info.id, "chat/message", false),
      ),
    ).resolves.toMatchObject({ eventBranch: { enabled: false } });
  });

  it("changes a logical WebSocket event branch behavior in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createEventBranchSession();

    await expect(
      settleMutation(
        session.setWebSocketListenerEventBehavior(wsListener.info.id, "chat/message", {
          preset: "echo",
        }),
      ),
    ).resolves.toMatchObject({ eventBranch: wsEventBranch });
    expect(api.setSnapshotWebSocketListenerEventBehavior).toHaveBeenCalledWith(
      sessionPath,
      wsListener.info.id,
      "chat/message",
      { preset: "echo" },
    );
  });

  it("sets a custom response on a logical WebSocket event branch in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createEventBranchSession();

    await expect(
      settleMutation(
        session.setWebSocketListenerEventCustomResponse(wsListener.info.id, "chat/message", {
          type: "send",
          dataType: "string",
          value: "custom",
        }),
      ),
    ).resolves.toMatchObject({ eventBranch: { customResponse: { value: "custom" } } });
  });

  it("sets a response on a logical WebSocket event branch in a session snapshot", async () => {
    vi.useFakeTimers();
    const session = createEventBranchSession();

    await expect(
      settleMutation(
        session.setWebSocketListenerEventResponse(wsListener.info.id, "chat/message", {
          type: "send",
          dataType: "string",
          value: "response",
        }),
      ),
    ).resolves.toMatchObject({ eventBranch: { response: { value: "response" } } });
  });

  it("reports a behavior change when its handler is no longer in the snapshot", async () => {
    vi.useFakeTimers();
    api.setSnapshotBehavior.mockReturnValue(snapshot([]));
    const session = new FileSnapshotCliSession(sessionPath);

    const missing = expect(session.setBehavior("a", "delay")).rejects.toThrow("Handler not found");

    await vi.advanceTimersByTimeAsync(300);
    await missing;
  });

  it("reports a temporary handler creation when the handler is absent from the snapshot", async () => {
    vi.useFakeTimers();
    api.addSnapshotTempHandler.mockReturnValue(snapshot([]));
    const session = new FileSnapshotCliSession(sessionPath);
    const assertion = expect(
      session.addTemp({ path: "/t", method: "get", contentType: "text/plain", status: "200" }),
    ).rejects.toThrow("Temporary handler was not added");

    await vi.advanceTimersByTimeAsync(300);

    await assertion;
  });
});
