import { afterEach, describe, expect, it } from "vitest";
import { setupServer, type SetupServer } from "msw/node";
import { createHandlerStore } from "../shared/store";
import { WEBSOCKET_HANDLER_BIND } from "../shared/websocket/bind";
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
    socket.addEventListener(
      "message",
      (event) => {
        clearTimeout(timer);
        resolve(String(event.data));
      },
      { once: true },
    );
  });

const waitFor = async (predicate: () => boolean, timeout = 2_000) => {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error("waitFor timeout");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

describe("wrapped ws", () => {
  it("binds setup handlers, discovers listeners, and restores them after reset", async () => {
    const chat = ws.link("ws://wrapper.test/chat");
    const ignored = ws.link("ws://wrapper.test/ignored");
    const reset = ws.link("ws://wrapper.test/reset");
    const handler = chat.addEventListener("connection", ({ client }) => {
      try {
        client.addEventListener("message", {
          handleEvent() {
            return undefined;
          },
        });
      } catch {
        // MSW clients only accept function listeners; the proxy must skip managed registration first.
      }
      client.addEventListener(
        "message",
        (event) => {
          client.send(`reply:${event.data}`);
        },
        { once: false },
      );
      client.addEventListener("close", () => undefined, { once: true });
    });
    const ignoredHandler = ignored.addEventListener("connection", () => undefined);
    const resetHandler = reset.addEventListener("connection", ({ client }) => {
      client.addEventListener("message", () => client.send("received"));
    });
    const descriptor = Object.getOwnPropertyDescriptor(handler, WEBSOCKET_HANDLER_BIND);

    expect(descriptor?.enumerable).toBe(false);
    expect(Object.keys(handler)).not.toContain(String(WEBSOCKET_HANDLER_BIND));

    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });
    const server = await store.getState().setupDevToolRuntime(handler, resetHandler);
    server.use(ignoredHandler);
    servers.push(server);
    server.listen();

    expect(store.getState().webSocketEndpoints).toEqual([
      { id: handler.id, endpoint: "ws://wrapper.test/chat", source: "code" },
      { id: resetHandler.id, endpoint: "ws://wrapper.test/reset", source: "code" },
    ]);
    expect(store.getState().webSocketListeners).toEqual([]);

    // Handlers added after setup are not bound to the dev-tool store.
    await openSocket("ws://wrapper.test/ignored");

    const first = await openSocket("ws://wrapper.test/chat");
    const reply = nextMessage(first);
    first.send("one");
    expect(await reply).toBe("reply:one");
    expect(store.getState().webSocketListeners).toEqual([
      {
        id: `${handler.id}:message:0`,
        endpointId: handler.id,
        order: 0,
        event: "message",
        source: "code",
      },
    ]);

    const firstListenerId = `${handler.id}:message:0`;
    store.getState().setWebSocketListenerBehavior(firstListenerId, {
      preset: "send",
      options: { message: "configured reply" },
    });
    const configuredReply = nextMessage(first);
    first.send("configured");
    expect(await configuredReply).toBe("configured reply");

    store.getState().setWebSocketListenerBehavior(firstListenerId, {
      preset: "close",
      options: { code: 4000, reason: "configured close" },
    });
    const closed = new Promise<{ code: number; reason: string }>((resolve) => {
      first.addEventListener(
        "close",
        (event) => resolve({ code: event.code, reason: event.reason }),
        { once: true },
      );
    });
    first.send("close");
    await expect(closed).resolves.toEqual({ code: 4000, reason: "configured close" });
    store.getState().setWebSocketListenerBehavior(firstListenerId, { preset: "default" });

    // A second connection repeats registration order zero and is upserted.
    const second = await openSocket("ws://wrapper.test/chat");
    const secondReply = nextMessage(second);
    second.send("two");
    expect(await secondReply).toBe("reply:two");
    expect(store.getState().webSocketListeners).toHaveLength(1);

    store.getState().setWebSocketListenerEnabled(firstListenerId, false);
    second.send("disabled listener");
    await new Promise((resolve) => setTimeout(resolve, 0));
    store.getState().setWebSocketListenerEnabled(firstListenerId, true);
    store.getState().setWebSocketListenerBehavior(firstListenerId, {
      preset: "send",
      options: {},
    });
    second.send("invalid send options");
    await new Promise((resolve) => setTimeout(resolve, 0));
    store.getState().setWebSocketListenerBehavior(firstListenerId, {
      preset: "close",
      options: { reason: 1 },
    });
    second.send("invalid close options");
    await new Promise((resolve) => setTimeout(resolve, 0));
    store.getState().setWebSocketEndpointEnabled(handler.id, false);
    await new Promise<void>((resolve) =>
      second.addEventListener("close", () => resolve(), { once: true }),
    );

    // Connect while disabled — exercises the passthrough (connectWebSocket) branch in websocket.ts.
    const passthrough = new WebSocket("ws://wrapper.test/chat");
    sockets.push(passthrough);
    await new Promise<void>((resolve) => {
      passthrough.addEventListener("open", resolve, { once: true });
      passthrough.addEventListener("error", resolve, { once: true });
    });

    store.getState().setWebSocketEndpointEnabled(handler.id, true);

    const socket = await openSocket("ws://wrapper.test/reset");
    const seen: string[] = [];
    socket.addEventListener("message", (event) => {
      seen.push(String(event.data));
    });
    socket.send("before reset");
    await waitFor(() => seen.length === 1);
    expect(seen).toEqual(["received"]);
    expect(store.getState().webSocketListeners).toHaveLength(2);

    store.getState().resetMSWDevTool();

    socket.send("after reset");
    await waitFor(() => seen.length === 2);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(seen).toEqual(["received", "received"]);

    store.getState().resetMSWDevTool();

    socket.send("after second reset");
    await waitFor(() => seen.length === 3);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(seen).toEqual(["received", "received", "received"]);
    expect(store.getState().webSocketListeners).toHaveLength(2);
  });

  it("preserves RegExp matchers in the state model", async () => {
    const regexp = /wrapper\.test\/regexp/i;
    const endpoint = ws.link(regexp);
    const handler = endpoint.addEventListener("connection", () => undefined);
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });

    const server = await store.getState().setupDevToolRuntime(handler);
    servers.push(server);

    expect(store.getState().webSocket.endpoints[0]?.matcher).toEqual({
      kind: "regexp",
      source: regexp.source,
      flags: regexp.flags,
    });
  });
});
