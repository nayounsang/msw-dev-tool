import { setupWorker, SetupWorker } from "msw/browser";
import { create } from "zustand";
import {
  FlattenHandler,
  Handler,
  HttpHandler,
  HttpHandlerBehavior,
  MimeType,
} from "./types";
import {
  getHandlerResponseByBehavior,
  getRowId,
  initMSWDevToolStore,
  isHttpHandler,
  mergeStorageData,
} from "./utils";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEY } from "./const";
import { http, HttpResponse, delay } from "msw";
import { HandlerSchema } from "./schema";

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
  addTempHandler: (handler: { data: HandlerSchema }) => void;
  getWorker: () => SetupWorker;
  getFlattenHandlerById: (id: string) => FlattenHandler | undefined;
  getHandlerBehavior: (id: string) => HttpHandlerBehavior | undefined;
  setHandlerBehavior: (id: string, behavior: HttpHandlerBehavior) => void;
  removeTempHandler: (id: string) => void;
}

export const handlerStore = create<HandlerStoreState>()(
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
      addTempHandler: (arg) => {
        const { data } = arg;
        const {
          path,
          method,
          response,
          status,
          contentType,
          delay: _delay,
          statusText,
          header,
        } = data;

        const contentLength = {
          [MimeType.APPLICATION_JSON]: response
            ? new Blob([response]).size.toString()
            : "0",
        } as Record<MimeType, string>;

        const id = getRowId({
          path,
          method,
        });

        const headers = {
          "Content-Type": contentType,
          ...(contentLength?.[contentType]
            ? { "Content-Length": contentLength[contentType] }
            : {}),
          ...(header ? JSON.parse(header) : {}),
        };

        const res = new HttpResponse(response, {
          status: Number(status),
          statusText: statusText,
          headers,
        });

        const handler = http[method](path, async () => {
          const behavior = get().getHandlerBehavior(id);
          return await getHandlerResponseByBehavior(behavior, async () => {
            await delay(_delay);

            return res;
          });
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
      removeTempHandler: (id: string) => {
        const handler = get().flattenHandlers.find((h) => h.id === id);
        if (!handler) {
          throw new Error(`Handler not found for the given id: ${id}`);
        }
        if (handler.type !== "temp") {
          throw new Error(
            `Handlers generated from codebase cannot be deleted (id: ${id}). You can only disable them.`
          );
        }
        set({
          flattenHandlers: get().flattenHandlers.filter((h) => h.id !== id),
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

export const setupDevToolWorker = handlerStore.getState().setupDevToolWorker;