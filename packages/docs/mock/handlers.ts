import { http, HttpResponse, type RequestHandler, type WebSocketHandler } from "msw";
import { ws } from "@msw-dev-tool/core/msw";
import { z } from "zod";
import { mockPosts } from "./const";
import { BASE_URL } from "@/const/api";
import { getPlaygroundWebSocketUrl } from "./websocket";

const playground = ws.link(getPlaygroundWebSocketUrl());
const playgroundMessageSchema = z.object({
  type: z.string().optional(),
  message: z.string().optional(),
});

const getMessageType = (data: unknown): string => {
  try {
    const message: unknown = JSON.parse(String(data));
    if (typeof message === "object" && message !== null && "type" in message) {
      return typeof message.type === "string" ? message.type : "unknown";
    }
  } catch {
    return "unknown";
  }

  return "unknown";
};

export const handlers: Array<RequestHandler | WebSocketHandler> = [
  http.get(`${BASE_URL}/posts`, () => {
    return HttpResponse.json(mockPosts);
  }),
  http.get<{ id: string }>(`${BASE_URL}/posts/:id`, ({ params }) => {
    const { id } = params;
    const post = mockPosts.find((post) => post.id === Number(id));

    if (!post) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(post);
  }),
  playground.addEventListener("connection", ({ client }) => {
    client.addEventListener(
      "message",
      (event) => {
        let parsed: unknown;

        try {
          parsed = JSON.parse(String(event.data));
        } catch {
          client.send(JSON.stringify({ type: "error", message: "Send a valid JSON message." }));
          return;
        }

        const result = playgroundMessageSchema.safeParse(parsed);
        if (!result.success) {
          client.send(JSON.stringify({ type: "error", message: "Send a valid JSON message." }));
          return;
        }

        const message = result.data;

        switch (message.type) {
          case "echo":
            client.send(JSON.stringify({ type: "echo", message: message.message ?? "" }));
            break;
          case "uppercase":
            client.send(
              JSON.stringify({ type: "uppercase", message: (message.message ?? "").toUpperCase() }),
            );
            break;
          case "ping":
            client.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
            break;
          default:
            client.send(JSON.stringify({ type: "error", message: "Unknown message type." }));
        }
      },
      {
        mswDevTool: {
          eventTypes: ["echo", "uppercase", "ping"],
          resolveEventType: getMessageType,
        },
      },
    );
  }),
];
