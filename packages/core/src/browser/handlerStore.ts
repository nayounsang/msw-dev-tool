import { setupWorker, SetupWorker } from "msw/browser";
import { createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  appendFlattenHandler,
  buildTempHandler,
  getFlattenHandlerById as findFlattenHandlerById,
  getHandlerBehavior as findHandlerBehavior,
  removeTempHandler as removeTempHandlerFromList,
  setHandlerBehavior as applyHandlerBehavior,
  wrapHandlersWithBehavior,
} from "../shared/domain";
import { STORAGE_KEY } from "../shared/const";
import {
  FlattenHandler,
  Handler,
  HttpHandlerBehavior,
} from "../shared/types";
import { initMSWDevToolStore } from "../shared/utils";
import { mergeStorageData } from "./storage";
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

export const handlerStore = createStore<HandlerStoreState>()(
  persist(
    (set, get) => {
      const lookupBehavior = (id: string) =>
        findHandlerBehavior(get().flattenHandlers, id);

      return {
        flattenHandlers: [],
        worker: null,
        restHandlers: [],
        handlerRowSelection: {},
        setupDevToolWorker: async (...handlers: Handler[]) => {
          const wrapped = wrapHandlersWithBehavior(handlers, lookupBehavior);
          const worker = setupWorker(...wrapped);

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
          const worker = get().getWorker();
          worker.resetHandlers();

          const { flattenHandlers, unsupportedHandlers } =
            initMSWDevToolStore(worker);

          set({
            worker,
            flattenHandlers,
            restHandlers: unsupportedHandlers,
          });
        },
        addTempHandler: ({ data }) => {
          const { handler, flattenHandler } = buildTempHandler(
            data,
            lookupBehavior
          );
          const worker = get().getWorker();
          worker.use(handler);

          set({
            worker,
            flattenHandlers: appendFlattenHandler(
              get().flattenHandlers,
              flattenHandler
            ),
          });
        },
        getWorker: () => {
          const worker = get().worker;
          if (!worker) throw new Error("Worker is not initialized");
          return worker;
        },
        getFlattenHandlerById: (id) =>
          findFlattenHandlerById(get().flattenHandlers, id),
        getHandlerBehavior: (id) => lookupBehavior(id),
        setHandlerBehavior: (id, behavior) => {
          set({
            flattenHandlers: applyHandlerBehavior(
              get().flattenHandlers,
              id,
              behavior
            ),
          });
        },
        removeTempHandler: (id) => {
          set({
            flattenHandlers: removeTempHandlerFromList(
              get().flattenHandlers,
              id
            ),
          });
        },
      };
    },
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
