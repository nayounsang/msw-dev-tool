import { HttpHandler } from "msw";
import { HandlerMap } from "../lib";

export interface FlatHandlerMap {
  url: string;
  method: string;
  handler: HttpHandler;
  checked: boolean;
}
export const flatHandlerMap = (handlerMap: HandlerMap): FlatHandlerMap[] => {
  return Object.entries(handlerMap).flatMap(([url, methods]) =>
    Object.entries(methods).map(([method, { handler, checked }]) => ({
      url,
      method,
      handler,
      checked,
    }))
  );
};
