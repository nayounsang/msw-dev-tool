import {
  CustomBehavior,
  FlattenHandler,
  Handler,
  HttpHandler,
  HttpHandlerBehavior,
  HttpMethod,
  HttpStatusCode,
  StorageData,
} from "./type";
import { SetupWorker } from "msw/lib/browser";
import { AsyncResponseResolverReturnType, delay, HttpResponse, passthrough } from "msw";
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
      method: method as HttpMethod,
      handler,
      behavior: HttpHandlerBehavior.DEFAULT,
    });

    return acc;
  }, [] as FlattenHandler[]);
  return { flattenHandlers, unsupportedHandlers };
};

export const initMSWDevToolStore = (worker: SetupWorker) => {
  const handlers = worker.listHandlers() as Handler[];
  const { flattenHandlers, unsupportedHandlers } =
    convertHandlers(handlers);

  return { worker, flattenHandlers, unsupportedHandlers };
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

  if (behavior === CustomBehavior.DISABLE) {
    return passthrough();
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
        behavior: savedHandler.behavior,
      };
    }
    return newHandler;
  });

  return { flattenHandlers };
};
