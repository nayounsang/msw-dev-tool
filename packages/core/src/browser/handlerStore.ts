import { setupWorker, SetupWorker } from "msw/browser";
import {
  appendFlattenHandler,
  buildTempHandler,
  getFlattenHandlerById as findFlattenHandlerById,
  getHandlerBehavior as findHandlerBehavior,
  rehydrateTempHandlers,
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
import { createStore } from "./createStore";
import { mergeStorageData } from "./storage";
import { HandlerSchema } from "./schema";

const registerTempHandlers = (
  worker: SetupWorker,
  flattenHandlers: FlattenHandler[]
) => {
  const tempHandlers = flattenHandlers
    .filter((handler) => handler.type === "temp")
    .map((handler) => handler.handler);
  if (tempHandlers.length > 0) {
    worker.use(...tempHandlers);
  }
};

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
  restHandlers: unknown[];
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

export const handlerStore = createStore<HandlerStoreState>(
  (set, get) => {
    const lookupBehavior = (id: string) =>
      findHandlerBehavior(get().flattenHandlers, id);

    return {
      flattenHandlers: [],
      worker: null,
      restHandlers: [],
      setupDevToolWorker: async (...handlers: Handler[]) => {
        const wrapped = wrapHandlersWithBehavior(handlers, lookupBehavior);
        const worker = setupWorker(...wrapped);

        const { flattenHandlers, unsupportedHandlers } =
          initMSWDevToolStore(worker);

        const { flattenHandlers: mergedHandlers } = mergeStorageData({
          flattenHandlers,
        });

        const rehydratedHandlers = rehydrateTempHandlers(
          mergedHandlers,
          lookupBehavior
        );
        registerTempHandlers(worker, rehydratedHandlers);

        set({
          worker,
          flattenHandlers: rehydratedHandlers,
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
        const flattenHandlers = appendFlattenHandler(
          get().flattenHandlers,
          flattenHandler
        );
        worker.use(handler);

        set({
          worker,
          flattenHandlers,
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
        const worker = get().getWorker();
        const flattenHandlers = removeTempHandlerFromList(
          get().flattenHandlers,
          id
        );

        // MSW has no single-handler unregister — reset runtime handlers
        // and re-register remaining temps.
        worker.resetHandlers();
        registerTempHandlers(worker, flattenHandlers);

        set({
          worker,
          flattenHandlers,
        });
      },
    };
  },
  {
    name: STORAGE_KEY,
    partialize: (state) => ({
      flattenHandlers: state.flattenHandlers.map(
        ({ handler: _handler, ...rest }) => rest
      ),
    }),
  }
);

export const setupDevToolWorker = handlerStore.getState().setupDevToolWorker;
