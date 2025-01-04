import { HttpHandler } from "msw";

export type HandlerMap = Record<
  string,
  Record<string, { handler: HttpHandler; checked: boolean }>
>;
