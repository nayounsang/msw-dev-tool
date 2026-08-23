import { afterEach, describe, expect, it, vi } from "vitest";
import { setupServer, type SetupServer } from "msw/node";
import { createHandlerStore } from "../shared/store";
import { WEBSOCKET_HANDLER_BIND, type WebSocketStoreAdapter } from "../shared/websocket/bind";
import { ws } from "./index";

const servers: SetupServer[] = [];
const sockets: WebSocket[] = [];

afterEach(() => {
  sockets.splice(0).forEach((socket) => socket.close());
  servers.splice(0).forEach((server) => server.close());
});

const openSocket = async (url: string): Promise<WebSocket> => {
  const socket = new WebSocket(url);
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket open timeout")), 2_000);
    socket.addEventListener("open", () => {
      clearTimeout(timer);
      resolve();
    });
    socket.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("WebSocket open failed"));
    });
  });
  return socket;
};

const nextMessage = (socket: WebSocket): Promise<string> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket message timeout")), 2_000);
    socket.addEventListener("message", (event) => {
      clearTimeout(timer);
      resolve(String(event.data));
    }, { once: true });
  });

const waitFor = async (predicate: () => boolean, timeout = 2_000) => {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error("waitFor timeout");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

describe("temporary WebSocket runtime", () => {
  it("applies temporary endpoint behavior and drops removed handlers from the runtime", async () => {
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });
    const server = await store.getState().setupDevToolRuntime();
    servers.push(server);

    const initialHandlerCount = server.listHandlers().length;
    const endpointId = store.getState().addTempWebSocketEndpoint({
      endpoint: "ws://wrapper.test/temp-runtime",
      matcher: { kind: "string", value: "ws://wrapper.test/temp-runtime" },
    });
    const listenerId = store.getState().addTempWebSocketListener({
      endpointId,
      behavior: { preset: "send", options: { message: "temp-reply" } },
    });

    expect(server.listHandlers()).toHaveLength(initialHandlerCount + 1);
    server.listen();

    // Disabled endpoint: connectWebSocket is called instead of dispatching messages.
    store.getState().setWebSocketEndpointEnabled(endpointId, false);
    const disabledSocket = new WebSocket("ws://wrapper.test/temp-runtime");
    sockets.push(disabledSocket);
    await new Promise<void>((resolve) => {
      disabledSocket.addEventListener("open", () => resolve(), { once: true });
      disabledSocket.addEventListener("error", () => resolve(), { once: true });
    });
    store.getState().setWebSocketEndpointEnabled(endpointId, true);

    const socket = await openSocket("ws://wrapper.test/temp-runtime");
    const reply = nextMessage(socket);
    socket.send("ping");
    expect(await reply).toBe("temp-reply");

    store.getState().setWebSocketListenerBehavior(listenerId, { preset: "echo" });
    const echoed = nextMessage(socket);
    socket.send("echo this");
    expect(await echoed).toBe("echo this");

    store.getState().setWebSocketListenerBehavior(listenerId, { preset: "send-null" });
    const nullMessage = nextMessage(socket);
    socket.send("null please");
    expect(await nullMessage).toBe("null");

    store.getState().setWebSocketListenerBehavior(listenerId, { preset: "no-reply" });
    let replied = false;
    socket.addEventListener("message", () => { replied = true; }, { once: true });
    socket.send("wait");
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(replied).toBe(false);
    expect(socket.readyState).toBe(WebSocket.OPEN);

    store.getState().setWebSocketListenerBehavior(listenerId, { preset: "send-sequence" });
    const messages: string[] = [];
    const completed = new Promise<void>((resolve) => {
      socket.addEventListener("message", (event) => {
        messages.push(String(event.data));
        if (messages.length === 3) resolve();
      });
    });
    socket.send("start");
    await completed;
    expect(messages).toEqual(["Test message from MSW Dev Tool", "Test message from MSW Dev Tool", "Test message from MSW Dev Tool"]);
    socket.close();
    await waitFor(() => socket.readyState === WebSocket.CLOSED);

    store.getState().setWebSocketListenerBehavior(
      listenerId,
      { preset: "close", options: { code: 4001, reason: "temp-close" } },
    );
    const closing = await openSocket("ws://wrapper.test/temp-runtime");
    const closed = new Promise<number>((resolve) => {
      closing.addEventListener("close", (event) => resolve(event.code), { once: true });
    });
    closing.send("close");
    expect(await closed).toBe(4001);

    store.getState().removeWebSocketEndpoint(endpointId);
    expect(server.listHandlers()).toHaveLength(initialHandlerCount);
    expect(store.getState().getWebSocketEndpoint(endpointId)).toBeUndefined();

    const resetEndpointId = store.getState().addTempWebSocketEndpoint({
      endpoint: "ws://wrapper.test/temp-runtime",
      matcher: { kind: "string", value: "ws://wrapper.test/temp-runtime" },
    });
    store.getState().addTempWebSocketListener({
      endpointId: resetEndpointId,
      behavior: { preset: "send", options: { message: "after-readd" } },
    });
    const live = await openSocket("ws://wrapper.test/temp-runtime");
    store.getState().resetMSWDevTool();
    live.close();
    await waitFor(() => live.readyState === WebSocket.CLOSED);
  });
});

describe("closeWebSocketConnections", () => {
  it("dispatches configured custom string, binary, and close responses", async () => {
    const endpoint = ws.link("ws://wrapper.test/custom-response");
    const handler = endpoint.addEventListener("connection", () => undefined);
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });
    await store.getState().setupDevToolRuntime(handler);
    const hook = Reflect.get(handler, WEBSOCKET_HANDLER_BIND) as { getAdapter(): WebSocketStoreAdapter | undefined };
    const adapter = hook.getAdapter()!;
    const endpointId = store.getState().webSocket.endpoints[0]!.endpointId;
    const listenerId = `${endpointId}:message:0`;
    store.getState().registerCodeWebSocketListener({ id: listenerId, endpointId, order: 0, event: "message", source: "code" });
    const client = { send: vi.fn(), close: vi.fn() };
    adapter.registerWebSocketConnection(endpointId, client);
    store.getState().setWebSocketListenerBehavior(listenerId, { preset: "custom response" });

    store.getState().setWebSocketListenerCustomResponse(listenerId, { type: "send", dataType: "string", value: "hello" });
    adapter.dispatchWebSocketMessage(endpointId, client, new Event("message"), listenerId);
    expect(client.send).toHaveBeenLastCalledWith("hello");

    store.getState().setWebSocketListenerCustomResponse(listenerId, { type: "send", dataType: "ArrayBuffer", value: "68 69" });
    adapter.dispatchWebSocketMessage(endpointId, client, new Event("message"), listenerId);
    expect(Array.from(new Uint8Array(client.send.mock.calls.at(-1)?.[0] as ArrayBuffer))).toEqual([104, 105]);

    store.getState().setWebSocketListenerCustomResponse(listenerId, { type: "close", code: 4001, reason: "Unauthorized" });
    adapter.dispatchWebSocketMessage(endpointId, client, new Event("message"), listenerId);
    expect(client.close).toHaveBeenCalledWith(4001, "Unauthorized");
  });

  it("throws the HTTP-compatible error when custom response is missing", async () => {
    const endpoint = ws.link("ws://wrapper.test/missing-custom-response");
    const handler = endpoint.addEventListener("connection", () => undefined);
    const store = createHandlerStore<SetupServer>({ createRuntime: (handlers) => setupServer(...handlers) });
    await store.getState().setupDevToolRuntime(handler);
    const hook = Reflect.get(handler, WEBSOCKET_HANDLER_BIND) as { getAdapter(): WebSocketStoreAdapter | undefined };
    const adapter = hook.getAdapter()!;
    const endpointId = store.getState().webSocket.endpoints[0]!.endpointId;
    const listenerId = `${endpointId}:message:0`;
    store.getState().registerCodeWebSocketListener({ id: listenerId, endpointId, order: 0, event: "message", source: "code" });
    const client = { send: vi.fn(), close: vi.fn() };
    store.getState().setWebSocketListenerBehavior(listenerId, { preset: "custom response" });
    expect(() => adapter.dispatchWebSocketMessage(endpointId, client, new Event("message"), listenerId))
      .toThrow("Please configure a custom response before using this behavior.");
    expect(client.send).not.toHaveBeenCalled();
    expect(client.close).not.toHaveBeenCalled();
  });

  it("closes all registered clients for an endpoint and clears tracking state", async () => {
    const endpoint = ws.link("ws://wrapper.test/close-conns");
    const handler = endpoint.addEventListener("connection", () => undefined);
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => {
        const server = setupServer(...handlers);
        servers.push(server);
        return server;
      },
    });
    await store.getState().setupDevToolRuntime(handler);

    const hook = Reflect.get(handler, WEBSOCKET_HANDLER_BIND) as { getAdapter(): WebSocketStoreAdapter | undefined };
    const adapter = hook.getAdapter()!;
    const endpointId = store.getState().webSocket.endpoints[0]?.endpointId ?? "";

    // Register a fake client directly instead of opening a real WebSocket.
    const fakeClose = vi.fn();
    adapter.registerWebSocketConnection(endpointId, { close: fakeClose });

    adapter.closeWebSocketConnections(endpointId);
    expect(fakeClose).toHaveBeenCalledOnce();
  });

  it("cancels scheduled sequence messages before closing connections", async () => {
    vi.useFakeTimers();
    try {
      const endpoint = ws.link("ws://wrapper.test/cancel-sequence");
      const handler = endpoint.addEventListener("connection", () => undefined);
      const store = createHandlerStore<SetupServer>({
        createRuntime: (handlers) => setupServer(...handlers),
      });
      await store.getState().setupDevToolRuntime(handler);
      const hook = Reflect.get(handler, WEBSOCKET_HANDLER_BIND) as { getAdapter(): WebSocketStoreAdapter | undefined };
      const adapter = hook.getAdapter()!;
      const endpointId = store.getState().webSocket.endpoints[0]!.endpointId;
      const listenerId = `${endpointId}:message:0`;
      store.getState().registerCodeWebSocketListener({
        id: listenerId,
        endpointId,
        order: 0,
        event: "message",
        source: "code",
      });
      store.getState().setWebSocketListenerBehavior(listenerId, { preset: "send-sequence" });
      const client = { send: vi.fn(), close: vi.fn() };
      adapter.registerWebSocketConnection(endpointId, client);
      adapter.dispatchWebSocketMessage(endpointId, client, new Event("message"), listenerId);
      expect(client.send).toHaveBeenCalledTimes(1);

      adapter.closeWebSocketConnections(endpointId);
      await vi.advanceTimersByTimeAsync(2_000);

      expect(client.close).toHaveBeenCalledOnce();
      expect(client.send).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels scheduled sequence messages during a Dev Tool reset", async () => {
    vi.useFakeTimers();
    try {
      const endpoint = ws.link("ws://wrapper.test/reset-sequence");
      const handler = endpoint.addEventListener("connection", () => undefined);
      const store = createHandlerStore<SetupServer>({
        createRuntime: (handlers) => setupServer(...handlers),
      });
      await store.getState().setupDevToolRuntime(handler);
      const hook = Reflect.get(handler, WEBSOCKET_HANDLER_BIND) as { getAdapter(): WebSocketStoreAdapter | undefined };
      const adapter = hook.getAdapter()!;
      const endpointId = store.getState().webSocket.endpoints[0]!.endpointId;
      const listenerId = `${endpointId}:message:0`;
      store.getState().registerCodeWebSocketListener({
        id: listenerId,
        endpointId,
        order: 0,
        event: "message",
        source: "code",
      });
      store.getState().setWebSocketListenerBehavior(listenerId, { preset: "send-sequence" });
      const client = { send: vi.fn(), close: vi.fn() };
      adapter.registerWebSocketConnection(endpointId, client);
      adapter.dispatchWebSocketMessage(endpointId, client, new Event("message"), listenerId);
      expect(client.send).toHaveBeenCalledTimes(1);

      adapter.resetWebSocketConnections();
      await vi.advanceTimersByTimeAsync(2_000);

      expect(client.send).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
