import { setupServer, type SetupServer } from "msw/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHandlerStore } from "./createHandlerStore";

const servers: SetupServer[] = [];

afterEach(() => {
  servers.splice(0).forEach((server) => server.close());
});

describe("createHandlerStore WebSocket coordination", () => {
  it("keeps a code listener when a temporary listener was added before connection", async () => {
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });
    await store.getState().setupDevToolRuntime();
    store.getState().registerCodeWebSocketEndpoint({
      id: "code-endpoint",
      endpoint: "ws://code.test/chat",
      source: "code",
    });

    const tempListenerId = store.getState().addTempWebSocketListener({
      endpointId: "code-endpoint",
      behavior: { preset: "send", options: { message: "temp" } },
    });
    store.getState().registerCodeWebSocketListener({
      id: "code-endpoint:message:0",
      endpointId: "code-endpoint",
      order: 0,
      event: "message",
      source: "code",
    });

    expect(store.getState().getWebSocketEndpoint("code-endpoint")?.listeners.map((listener) => listener.info.id)).toEqual([
      tempListenerId,
      "code-endpoint:message:0",
    ]);
  });

  it("coordinates temporary lifecycle and direct code registration", async () => {
    const runtime = {
      addTempEndpoint: vi.fn(),
      removeEndpoint: vi.fn(),
      closeEndpointConnections: vi.fn(),
      resetTempEndpoints: vi.fn(),
    };
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => {
        const server = setupServer(...handlers);
        servers.push(server);
        return server;
      },
      webSocketRuntime: runtime,
    });
    await store.getState().setupDevToolRuntime();

    store.getState().registerCodeWebSocketEndpoint({
      id: "manual-endpoint",
      endpoint: "ws://manual.test",
      source: "code",
    });
    store.getState().registerCodeWebSocketListener({
      id: "orphan-listener",
      endpointId: "missing-endpoint",
      order: 0,
      event: "message",
      source: "code",
    });

    const endpointId = store.getState().addTempWebSocketEndpoint({
      endpoint: "ws://temp.test",
      matcher: { kind: "string", value: "ws://temp.test" },
    });
    const listenerId = store.getState().addTempWebSocketListener({
      endpointId,
      behavior: { preset: "echo" },
    });
    expect(store.getState().getWebSocketListener(listenerId)).toMatchObject({
      endpointId,
    });
    store.getState().setWebSocketEndpointEnabled(endpointId, true);
    store.getState().setWebSocketEndpointEnabled(endpointId, false);
    store.getState().setWebSocketListenerEnabled(listenerId, false);
    store.getState().setWebSocketListenerBehavior(listenerId, { preset: "no-reply" });
    store.getState().removeWebSocketListener(listenerId);
    store.getState().removeWebSocketEndpoint(endpointId);
    store.getState().resetMSWDevTool();

    expect(store.getState().getHandlerInfo("orphan-listener")).toMatchObject({
      endpoint: "missing-endpoint",
    });
    store.getState().registerHandler({
      id: "manual-info",
      kind: "http",
      endpoint: "/manual",
      operation: "get",
      source: "temp",
    });
    expect(store.getState().getHandlerInfo("manual-info")).toMatchObject({ endpoint: "/manual" });
    store.getState().unregisterHandler("manual-info");
    expect(store.getState().getHandlerInfo("manual-info")).toBeUndefined();
    expect(runtime.addTempEndpoint).toHaveBeenCalledOnce();
    expect(runtime.closeEndpointConnections).toHaveBeenCalledWith(endpointId);
    expect(runtime.removeEndpoint).toHaveBeenCalledWith(endpointId);
  });

  it("rebuilds hydrated temporary WebSocket handlers in an active runtime", async () => {
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });
    await store.getState().setupDevToolRuntime();

    const endpointId = store.getState().addTempWebSocketEndpoint({
      endpoint: "ws://temp.test/hydrated",
      matcher: { kind: "regexp", source: "temp\\.test/hydrated", flags: "i" },
    });
    store.getState().addTempWebSocketListener({
      endpointId,
      behavior: { preset: "send", options: { message: "hydrated" } },
    });
    store.getState().hydrateWebSocket(store.getState().webSocket.endpoints);

    expect(store.getState().getWebSocketEndpoint(endpointId)).toBeDefined();
  });

  it("does not leave removed or rehydrated temporary handlers on the runtime", async () => {
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });
    const runtime = await store.getState().setupDevToolRuntime();
    servers.push(runtime);

    const initialCount = runtime.listHandlers().length;
    const first = store.getState().addTempWebSocketEndpoint({
      endpoint: "ws://temp.test/first",
      matcher: { kind: "string", value: "ws://temp.test/first" },
    });
    const second = store.getState().addTempWebSocketEndpoint({
      endpoint: "ws://temp.test/second",
      matcher: { kind: "regexp", source: "temp\\.test/second", flags: "i" },
    });
    expect(runtime.listHandlers()).toHaveLength(initialCount + 2);

    store.getState().hydrateWebSocket(store.getState().webSocket.endpoints);
    expect(runtime.listHandlers()).toHaveLength(initialCount + 2);

    store.getState().removeWebSocketEndpoint(first);
    expect(runtime.listHandlers()).toHaveLength(initialCount + 1);
    expect(store.getState().getWebSocketEndpoint(first)).toBeUndefined();
    expect(store.getState().getWebSocketEndpoint(second)).toBeDefined();

    store.getState().removeWebSocketEndpoint(second);
    expect(runtime.listHandlers()).toHaveLength(initialCount);
  });

  it("installs persisted temporary WebSocket handlers during setup", async () => {
    const endpointId = "websocket:endpoint:string:ws://temp.test/persisted:0";
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
      getStoredWebSocketState: () => [{
        info: {
          id: endpointId,
          kind: "websocket",
          endpoint: "ws://temp.test/persisted",
          operation: "endpoint",
          source: "temp",
        },
        endpointId,
        matcher: { kind: "string", value: "ws://temp.test/persisted" },
        enabled: true,
        listeners: [],
      }],
    });
    const runtime = await store.getState().setupDevToolRuntime();
    servers.push(runtime);

    expect(store.getState().getWebSocketEndpoint(endpointId)).toBeDefined();
    expect(runtime.listHandlers()).toHaveLength(1);
  });

  it("throws when the runtime is used before setup", () => {
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });

    expect(() => store.getState().getRuntime()).toThrow("MSW Dev Tool runtime is not initialized");
  });

  it("hydrates and removes temporary endpoints before the runtime exists", () => {
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });
    const endpointId = "websocket:endpoint:string:ws://temp.test/offline:0";
    store.getState().hydrateWebSocket([{
      info: {
        id: endpointId,
        kind: "websocket",
        endpoint: "ws://temp.test/offline",
        operation: "endpoint",
        source: "temp",
      },
      endpointId,
      matcher: { kind: "string", value: "ws://temp.test/offline" },
      enabled: true,
      listeners: [],
    }]);

    expect(store.getState().getWebSocketEndpoint(endpointId)).toBeDefined();
    store.getState().removeWebSocketEndpoint(endpointId);
    expect(store.getState().getWebSocketEndpoint(endpointId)).toBeUndefined();
  });

  it("rejects malformed persisted WebSocket state at the store boundary", async () => {
    let runtime: SetupServer | undefined;
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => {
        runtime = setupServer(...handlers);
        return runtime;
      },
      getStoredWebSocketState: () => ({ invalid: true }),
    });

    await expect(store.getState().setupDevToolRuntime()).rejects.toThrow();
    runtime?.close();
  });
});
