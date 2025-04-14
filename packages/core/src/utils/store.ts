import { SetupWorker } from "msw/browser";
import {
  FlattenHandler,
  Handler,
  HttpHandler,
  HttpHandlerBehavior,
  HttpMethod,
} from "../types";
import { isHttpHandler } from "./validate";

export const getRowId = ({ path, method }: { path: string; method: string }) =>
  JSON.stringify({
    path,
    method,
  });

export const getObjFromRowId = (rowId: string) =>
  JSON.parse(rowId) as { path: string; method: string };

export const convertHandlers = (handlers: Handler[]) => {
  const unsupportedHandlers: Handler[] = [];
  const flattenHandlers: FlattenHandler[] = handlers.reduce((acc, _handler) => {
    // Current, GraphQL & WebSocketHandler is not supported.
    const handler = _handler as HttpHandler;
    if (!isHttpHandler(handler)) {
      unsupportedHandlers.push(handler);
      return acc;
    }

    const { method: _method, path: _path } = handler.info;
    const [method, path] = [_method.toString(), _path.toString()];
    acc.push({
      id: getRowId({ path, method }),
      path,
      method: method as HttpMethod,
      handler,
      behavior: HttpHandlerBehavior.DEFAULT,
      type: "default",
    });

    return acc;
  }, [] as FlattenHandler[]);
  return { flattenHandlers, unsupportedHandlers };
};

export const initMSWDevToolStore = (worker: SetupWorker) => {
  const handlers = worker.listHandlers() as Handler[];
  const { flattenHandlers, unsupportedHandlers } = convertHandlers(handlers);

  return { worker, flattenHandlers, unsupportedHandlers };
};
