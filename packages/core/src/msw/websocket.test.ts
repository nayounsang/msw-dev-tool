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
    socket.addEventListener("message", (event) => {
      clearTimeout(timer);
      resolve(String(event.data));
    }, { once: true });
  });

describe("wrapped ws", () => {
  it("binds setup handlers, discovers listeners, and restores them after reset", async () => {
    const chat = ws.link("ws://wrapper.test/chat");
    const ignored = ws.link("ws://wrapper.test/ignored");
    const reset = ws.link("ws://wrapper.test/reset");
    const handler = chat.addEventListener("connection", ({ client }) => {
      client.addEventListener("message", (event) => {
        client.send(`reply:${event.data}`);
      }, { once: false });
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

    // A second connection repeats registration order zero and is upserted.
    const second = await openSocket("ws://wrapper.test/chat");
    const secondReply = nextMessage(second);
    second.send("two");
    expect(await secondReply).toBe("reply:two");
    expect(store.getState().webSocketListeners).toHaveLength(1);

    const socket = await openSocket("ws://wrapper.test/reset");
    const beforeReset = nextMessage(socket);
    socket.send("before reset");
    expect(await beforeReset).toBe("received");
    expect(store.getState().webSocketListeners).toHaveLength(2);

    store.getState().resetMSWDevTool();

    const afterReset = nextMessage(socket);
    socket.send("after reset");
    expect(await afterReset).toBe("received");
    expect(store.getState().webSocketListeners).toHaveLength(2);
  });

});
