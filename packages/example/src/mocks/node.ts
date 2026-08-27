import { setupDevToolServer } from "@msw-dev-tool/core/node";
import { ws } from "@msw-dev-tool/core/msw";
import { handlers } from "./handlers";

let serverPromise: ReturnType<typeof setupDevToolServer> | null = null;

const chat = ws.link("ws://node.example.local/chat");
const nodeWebSocketHandlers = [
  chat.addEventListener("connection", ({ client }) => {
    client.addEventListener(
      "message",
      (event) => {
        client.send(`echo:${String(event.data)}`);
      },
      {
        mswDevTool: {
          eventTypes: ["chat/join", "chat/message"],
          resolveEventType: (data: unknown) => JSON.parse(String(data)).type,
        },
      },
    );
    client.addEventListener("message", (event) => client.send(`audit:${String(event.data)}`));
  }),
];

export const ensureMswServer = async () => {
  if (!serverPromise) {
    serverPromise = (async () => {
      const server = await setupDevToolServer(...handlers, ...nodeWebSocketHandlers);
      server.listen({ onUnhandledRequest: "bypass" });
      return server;
    })();
  }

  const server = await serverPromise;
  // Re-apply interception in case Next overwrote global fetch.
  server.listen({ onUnhandledRequest: "bypass" });
  return server;
};

export const startMswServer = ensureMswServer;
