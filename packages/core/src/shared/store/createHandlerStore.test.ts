import { setupServer, type SetupServer } from "msw/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHandlerStore } from "./createHandlerStore";

const servers: SetupServer[] = [];

afterEach(() => {
  servers.splice(0).forEach((server) => server.close());
});

describe("createHandlerStore WebSocket coordination", () => {
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
      behavior: { preset: "reply" },
    });
    store.getState().setWebSocketEndpointEnabled(endpointId, true);
    store.getState().setWebSocketEndpointEnabled(endpointId, false);
    store.getState().setWebSocketListenerEnabled(listenerId, false);
    store.getState().setWebSocketListenerBehavior(listenerId, { preset: "drop" });
    store.getState().removeWebSocketListener(listenerId);
    store.getState().removeWebSocketEndpoint(endpointId);
    store.getState().resetMSWDevTool();

    expect(store.getState().getHandlerInfo("orphan-listener")).toMatchObject({
      endpoint: "missing-endpoint",
    });
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
      behavior: { preset: "default" },
    });
    store.getState().hydrateWebSocket(store.getState().webSocket.endpoints);

    expect(store.getState().getWebSocketEndpoint(endpointId)).toBeDefined();
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
