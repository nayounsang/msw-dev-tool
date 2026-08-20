import { http, HttpResponse, RequestHandler, WebSocketHandler } from "msw";
import { ws } from "@msw-dev-tool/core/msw";
import { users } from "./data";

/** Absolute URL used by RSC so SSR fetch does not hit the Next server itself. */
export const SSR_USERS_URL = "https://ssr.example.local/users";

const browserChat = ws.link("ws://browser.example.local/chat");

export const handlers: Array<RequestHandler | WebSocketHandler> = [
  // Node's fetch requires an absolute URL, unlike browser fetch.
  http.get("*/api/users", () => {
    return HttpResponse.json(users, { status: 200 });
  }),
  http.get<{ id: string }>("*/api/users/:id", ({ params }) => {
    const user = users.find((u) => u.id === parseInt(params.id, 10));
    if (!user) {
      return HttpResponse.json({ error: "User not found" }, { status: 404 });
    }
    return HttpResponse.json(user, { status: 200 });
  }),
  http.get("https://example.com/users", () => {
    return HttpResponse.json(users, { status: 200 });
  }),
  http.get(SSR_USERS_URL, () => {
    return HttpResponse.json(users, { status: 200 });
  }),
  browserChat.addEventListener("connection", ({ client }) => {
    client.addEventListener("message", (event) => {
      client.send(`echo:${String(event.data)}`);
    });
  }),
];
