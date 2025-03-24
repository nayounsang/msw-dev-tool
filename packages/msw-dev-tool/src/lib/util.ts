import {
  CustomBehavior,
  FlattenHandler,
  Handler,
  HttpHandler,
  HttpHandlerBehavior,
  HttpStatusCode,
  StorageData,
} from "./type";
import { dummyHandler } from "../const/handler";
import { SetupWorker } from "msw/lib/browser";
import { RowSelectionState } from "@tanstack/react-table";
import { AsyncResponseResolverReturnType, delay, HttpResponse } from "msw";
import { STORAGE_KEY } from "./const";

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
      method,
      enabled: true,
      handler,
      behavior: HttpHandlerBehavior.DEFAULT,
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
  const { flattenHandlers: newFlattenHandlers, unsupportedHandlers } =
    convertHandlers(handlers);
  const { flattenHandlers } = mergeStorageData({
    flattenHandlers: newFlattenHandlers,
  });
  const handlerRowSelection = flattenHandlers.reduce((acc, handler) => {
    acc[handler.id] = handler.enabled;
    return acc;
  }, {} as RowSelectionState);

  return { worker, flattenHandlers, unsupportedHandlers, handlerRowSelection };
};

export const isHttpHandler = (handler: Handler): handler is HttpHandler => {
  return (
    "info" in handler && "method" in handler.info && "path" in handler.info
  );
};

export const getHandlerResponseByBehavior = async (
  behavior: HttpHandlerBehavior | undefined,
  originalResolverCallback: () => AsyncResponseResolverReturnType<any>
): Promise<AsyncResponseResolverReturnType<any>> => {
  if (!behavior || behavior === CustomBehavior.DEFAULT) {
    return originalResolverCallback();
  }

  if (behavior === CustomBehavior.DELAY) {
    await delay("infinite");
    return new Response();
  }

  if (behavior === CustomBehavior.RETURN_NULL) {
    return HttpResponse.json(null, { status: 200 });
  }

  if (behavior === CustomBehavior.NETWORK_ERROR) {
    return HttpResponse.error();
  }

  for (const code of Object.values(HttpStatusCode)) {
    if (behavior === code) {
      return new HttpResponse(null, {
        status: code,
        statusText: `${code} triggered by dev tools.`,
      });
    }
  }

  return originalResolverCallback();
};

export const getStorageData = (): StorageData => {
  const storage = sessionStorage.getItem(STORAGE_KEY);
  if (!storage) return { flattenHandlers: [] };
  return JSON.parse(storage).state;
};

export const mergeStorageData = ({
  flattenHandlers: newFlattenHandlers,
}: StorageData) => {
  const { flattenHandlers: savedFlattenHandlers } = getStorageData();

  // Merge with saved and new element based on worker's handlers
  const flattenHandlers = newFlattenHandlers.map((newHandler) => {
    const savedHandler = savedFlattenHandlers.find(
      (h) => h.id === newHandler.id
    );
    if (savedHandler) {
      return {
        ...newHandler,
        enabled: savedHandler.enabled,
        behavior: savedHandler.behavior,
      };
    }
    return newHandler;
  });

  return { flattenHandlers };
};
