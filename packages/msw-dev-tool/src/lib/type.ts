import { HttpHandler, RequestHandler, WebSocketHandler } from "msw";

export type FlattenHandler = {
  id: string;
  path: string;
  method: string;
  enabled: boolean;
  handler: HttpHandler;
};

export type Handler = RequestHandler | WebSocketHandler;
