import { HttpHandler, RequestHandler, WebSocketHandler } from "msw";

export type HandlerMap = Record<
  string,
  Record<string, { handler: HttpHandler; checked: boolean }>
>;

export type Handler = RequestHandler | WebSocketHandler;