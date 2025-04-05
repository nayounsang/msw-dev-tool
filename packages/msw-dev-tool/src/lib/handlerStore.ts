import { SetupWorker } from "msw/browser";
import { create } from "zustand";
import {
  FlattenHandler,
  Handler,
  HttpHandler,
  HttpHandlerBehavior,
  HttpMethod,
} from "./type";
import {
  getHandlerResponseByBehavior,
  getRowId,
  initMSWDevToolStore,
  isHttpHandler,
  mergeStorageData,
} from "./util";
import { setupWorker as _setupWorker } from "../utils/mswBrowser";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEY } from "./const";
import { http } from "msw";

export interface HandlerStoreState {
  /**
   * @remarks ⚠️ To be safe, access `getWorker()` rather than `get().worker` directly.
   */
  worker: SetupWorker | null;
  /**
   * GraphQL or WebSocketHandler
   *
   * **Currently not supported**
   */
  restHandlers: Handler[];
  flattenHandlers: FlattenHandler[];
  setupDevToolWorker: (...handlers: Handler[]) => Promise<SetupWorker>;
  resetMSWDevTool: () => void;
  addTempHandler: (handler: {
    method: HttpMethod;
    path: string;
    response: string;
  }) => void;
  getWorker: () => SetupWorker;
  getFlattenHandlerById: (id: string) => FlattenHandler | undefined;
  getHandlerBehavior: (id: string) => HttpHandlerBehavior | undefined;
  setHandlerBehavior: (id: string, behavior: HttpHandlerBehavior) => void;
}

export const useHandlerStore = create<HandlerStoreState>()(
  persist(
    (set, get) => ({
      flattenHandlers: [],
      worker: null,
      restHandlers: [],
      handlerRowSelection: {},
      setupDevToolWorker: async (...handlers: Handler[]) => {
        const _handlers = handlers.map((handler) => {
          if (!isHttpHandler(handler)) {
            return handler;
          }

          const originalResolver = handler.resolver;
          handler.resolver = async (args) => {
            const id = getRowId({
              path: handler.info.path.toString(),
              method: handler.info.method.toString(),
            });
            const behavior = get().getHandlerBehavior(id);

            return await getHandlerResponseByBehavior(behavior, () =>
              originalResolver(args)
            );
          };
          return handler;
        });

        const setupWorker = await _setupWorker;
        if (!setupWorker) {
          throw new Error(
            "Fail to import 'msw/browser'. Is environment is not browser?"
          );
        }
        const worker = setupWorker(..._handlers);

        const { flattenHandlers, unsupportedHandlers } =
          initMSWDevToolStore(worker);

        const { flattenHandlers: mergedHandlers } = mergeStorageData({
          flattenHandlers,
        });

        set({
          worker,
          flattenHandlers: mergedHandlers,
          restHandlers: unsupportedHandlers,
        });

        return worker;
      },
      resetMSWDevTool: () => {
        const _worker = get().getWorker();
        _worker.resetHandlers();

        const { worker, flattenHandlers, unsupportedHandlers } =
          initMSWDevToolStore(_worker);

        set({
          worker,
          flattenHandlers,
          restHandlers: unsupportedHandlers,
        });
      },
      addTempHandler: ({ method, path, response }) => {
        const id = getRowId({
          path: path,
          method: method,
        });

        const handler = http.get(path, async () => {
          const behavior = get().getHandlerBehavior(id);
          return await getHandlerResponseByBehavior(behavior, () =>
            Response.json(JSON.parse(response))
          );
        }) as HttpHandler;

        const worker = get().getWorker();
        worker.use(handler);

        const newFlattenHandlers: FlattenHandler[] = [
          ...get().flattenHandlers,
          {
            id,
            path,
            method,
            handler,
            type: "temp",
            behavior: HttpHandlerBehavior.DEFAULT,
          },
        ];

        set({
          worker,
          flattenHandlers: newFlattenHandlers,
        });
      },
      getWorker: () => {
        const worker = get().worker;
        if (!worker) throw new Error("Worker is not initialized");
        return worker;
      },
      getFlattenHandlerById: (id: string) => {
        return get().flattenHandlers.find((handler) => handler.id === id);
      },
      getHandlerBehavior: (id: string) => {
        const handler = get().getFlattenHandlerById(id);
        if (!handler) return undefined;
        return handler.behavior;
      },
      setHandlerBehavior: (id: string, behavior: HttpHandlerBehavior) => {
        set({
          flattenHandlers: get().flattenHandlers.map((handler) => {
            if (handler.id === id) {
              return { ...handler, behavior };
            }
            return handler;
          }),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        flattenHandlers: state.flattenHandlers,
      }),
    }
  )
);

export const setupDevToolWorker = useHandlerStore.getState().setupDevToolWorker;

export const isDuplicateHandler = (id: string) => {
  return useHandlerStore
    .getState()
    .flattenHandlers.some((handler) => handler.id === id);
};
