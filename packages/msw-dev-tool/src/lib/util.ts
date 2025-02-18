import { HttpHandler } from "msw";
import { FlattenHandler, Handler } from "./type";
import { dummyHandler } from "../const/handler";
import { SetupWorker } from "msw/lib/browser";
import { initial } from "lodash";
import { RowSelectionState } from "@tanstack/react-table";

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
    if (!("info" in handler && handler.info.method && handler.info.path)) {
      unsupportedHandlers.push(handler);
      return acc;
    }

    const { method: _method, path: _path } = handler.info;
    const [method, path] = [_method.toString(), _path.toString()];
    acc.push({
      id: getRowId({ path, method }),
      path,
      method,
      enabled: true,
      handler,
    });

    return acc;
  }, [] as FlattenHandler[]);
  return { flattenHandlers, unsupportedHandlers };
};

export const getTotalEnableHandlers = (
  flattenHandlers: FlattenHandler[],
  restHandlers: Handler[]
) => {
  const checkedHttpHandlers = flattenHandlers
    .filter((h) => h.enabled)
    .map((h) => h.handler);
  return [...checkedHttpHandlers, ...restHandlers];
};

/**
 * This has to do with `msw` internal workings.
 * If I spread an empty array in `resetHandlers`, it will be replaced by `initialHandler`.
 * Therefore, I proposed the `clear` method, but unfortunately it was not accepted!
 */
export const updateEnableHandlers = (
  worker: SetupWorker,
  totalEnableHandlers: Handler[]
) => {
  if (totalEnableHandlers.length === 0) {
    worker.resetHandlers(dummyHandler);
    return;
  }

  worker.resetHandlers(...totalEnableHandlers);
};

export const initMSWDevToolStore = (worker: SetupWorker) => {
  const handlers = worker.listHandlers() as Handler[];
  const { flattenHandlers, unsupportedHandlers } = convertHandlers(handlers);
  const handlerRowSelection = flattenHandlers.reduce((acc, handler) => {
    acc[handler.id] = handler.enabled;
    return acc;
  }, {} as RowSelectionState);

  return { worker, flattenHandlers, unsupportedHandlers, handlerRowSelection };
};
