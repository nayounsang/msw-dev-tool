import { afterEach, describe, expect, it } from "vitest";
import { setupServer, type SetupServer } from "msw/node";
import { createHandlerStore } from "../shared/store";

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
    store.getState().addTempWebSocketListener({
      endpointId,
      behavior: { preset: "send", options: { message: "temp-reply" } },
    });

    expect(server.listHandlers()).toHaveLength(initialHandlerCount + 1);

    store.getState().hydrateWebSocket(store.getState().webSocket.endpoints);
    expect(server.listHandlers()).toHaveLength(initialHandlerCount + 1);
    server.listen();

    const socket = await openSocket("ws://wrapper.test/temp-runtime");
    const reply = nextMessage(socket);
    socket.send("ping");
    expect(await reply).toBe("temp-reply");
    socket.close();
    await waitFor(() => socket.readyState === WebSocket.CLOSED);

    store.getState().setWebSocketListenerBehavior(
      store.getState().webSocket.listeners[0]!.info.id,
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
  });
});
