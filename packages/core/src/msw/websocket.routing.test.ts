import { afterEach, describe, expect, it } from "vitest";
import { setupServer, type SetupServer } from "msw/node";
import { z } from "zod";
import { createHandlerStore } from "../shared/store";
import { ws } from "./index";

let server: SetupServer | undefined;
let socket: WebSocket | undefined;

afterEach(() => {
  socket?.close();
  socket = undefined;
  server?.close();
  server = undefined;
});

const openSocket = async (url: string): Promise<WebSocket> => {
  const opened = new WebSocket(url);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket open timeout")), 2_000);
    opened.addEventListener(
      "open",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
    opened.addEventListener(
      "error",
      () => {
        clearTimeout(timer);
        reject(new Error("WebSocket open failed"));
      },
      { once: true },
    );
  });
  return opened;
};

const nextMessage = (opened: WebSocket): Promise<string> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket message timeout")), 2_000);
    opened.addEventListener(
      "message",
      (event) => {
        clearTimeout(timer);
        resolve(String(event.data));
      },
      { once: true },
    );
  });

describe("wrapped ws logical event routing", () => {
  it("routes declared events and falls back for unknown or invalid payloads", async () => {
    const incomingSchema = z.object({ type: z.string() });
    const chat = ws.link("ws://wrapper.test/logical-events");
    const handler = chat.addEventListener("connection", ({ client }) => {
      client.addEventListener<string>("message", (event) => client.send(`original:${event.data}`), {
        once: false,
        mswDevTool: {
          eventTypes: ["chat/join", "chat/message"],
          resolveEventType: (data) => incomingSchema.parse(JSON.parse(data)).type,
        },
      });
    });
    const store = createHandlerStore<SetupServer>({
      createRuntime: (handlers) => setupServer(...handlers),
    });
    server = await store.getState().setupDevToolRuntime(handler);
    server.listen();
    socket = await openSocket("ws://wrapper.test/logical-events");
    const listenerId = `${handler.id}:message:0`;

    expect(store.getState().getWebSocketListener(listenerId)?.eventBranches).toEqual([
      { eventType: "chat/join", enabled: true, behavior: { preset: "default" } },
      { eventType: "chat/message", enabled: true, behavior: { preset: "default" } },
    ]);
    store.getState().setWebSocketListenerEventBehavior(listenerId, "chat/join", {
      preset: "send",
      options: { message: "joined" },
    });

    const joined = nextMessage(socket);
    socket.send(JSON.stringify({ type: "chat/join" }));
    await expect(joined).resolves.toBe("joined");

    const message = nextMessage(socket);
    socket.send(JSON.stringify({ type: "chat/message" }));
    await expect(message).resolves.toBe('original:{"type":"chat/message"}');

    const unknown = nextMessage(socket);
    socket.send(JSON.stringify({ type: "chat/unknown" }));
    await expect(unknown).resolves.toBe('original:{"type":"chat/unknown"}');

    const invalid = nextMessage(socket);
    socket.send("invalid JSON");
    await expect(invalid).resolves.toBe("original:invalid JSON");
  });
});
