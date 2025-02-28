import { http, HttpResponse, RequestHandler, WebSocketHandler } from "msw";
import { users } from "./data";

export const handlers: Array<RequestHandler | WebSocketHandler> = [
  http.get("/api/users", () => {
    return HttpResponse.json(users, { status: 200 });
  }),
  http.get<{ id: string }>("/api/users/:id", ({ params }) => {
    const user = users.find((u) => u.id === parseInt(params.id, 10));
    if (!user) {
      return HttpResponse.json({ error: "User not found" }, { status: 404 });
    }
    return HttpResponse.json(user, { status: 200 });
  }),
  http.get("https://example.com/users", () => {
    return HttpResponse.json(users, { status: 200 });
  }),
];
