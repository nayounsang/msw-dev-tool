import {
  appendFlattenHandler,
  buildTempHandler,
  getFlattenHandlerById as findFlattenHandlerById,
  getHandlerBehavior as findHandlerBehavior,
  getHandlerCustomResponse as findHandlerCustomResponse,
  rehydrateTempHandlers,
  removeTempHandler as removeTempHandlerFromList,
  setHandlerBehavior as applyHandlerBehavior,
  setHandlerCustomResponse as applyHandlerCustomResponse,
  wrapHandlersWithBehavior,
} from "../domain";
import {
  FlattenHandler,
  Handler,
} from "../types";
import { initMSWDevToolStore } from "../utils";
import { createStore, StoreApi } from "./createStore";
import {
  CreateHandlerStoreOptions,
  HandlerStoreInternalState,
  MswDevToolRuntime,
} from "./types";

export type {
  CreateHandlerStoreOptions,
  HandlerStoreBaseState,
  HandlerStoreInternalState,
  MswDevToolRuntime,
} from "./types";

const registerTempHandlers = (
  runtime: MswDevToolRuntime,
  flattenHandlers: FlattenHandler[]
) => {
  const tempHandlers = flattenHandlers
    .filter((handler) => handler.type === "temp")
    .map((handler) => handler.handler);
  if (tempHandlers.length > 0) {
    runtime.use(...tempHandlers);
  }
};

export const createHandlerStore = <TRuntime extends MswDevToolRuntime>(
  options: CreateHandlerStoreOptions<TRuntime>
): StoreApi<HandlerStoreInternalState<TRuntime>> => {
  const store = createStore<HandlerStoreInternalState<TRuntime>>(
    (set, get) => {
      const lookupBehavior = (id: string) =>
        findHandlerBehavior(get().flattenHandlers, id);
      const lookupCustomResponse = (id: string) =>
        findHandlerCustomResponse(get().flattenHandlers, id);

      return {
        flattenHandlers: [],
        runtime: null,
        restHandlers: [],
        setupDevToolRuntime: async (...handlers: Handler[]) => {
          const wrapped = wrapHandlersWithBehavior(
            handlers,
            lookupBehavior,
            lookupCustomResponse
          );
          const runtime = options.createRuntime(wrapped);

          const { flattenHandlers, unsupportedHandlers } =
            initMSWDevToolStore(runtime);

          const mergedHandlers = options.mergeOnSetup
            ? options.mergeOnSetup({
                flattenHandlers,
                unsupportedHandlers,
                runtime,
              })
            : flattenHandlers;

          const rehydratedHandlers = rehydrateTempHandlers(
            mergedHandlers,
            lookupBehavior,
            lookupCustomResponse
          );
          registerTempHandlers(runtime, rehydratedHandlers);

          // Must run before the first persist triggered by `set`.
          options.onSetup?.({
            runtime,
            flattenHandlers: rehydratedHandlers,
          });

          set({
            runtime,
            flattenHandlers: rehydratedHandlers,
            restHandlers: unsupportedHandlers,
          });

          return runtime;
        },
        resetMSWDevTool: () => {
          const runtime = get().getRuntime();
          runtime.resetHandlers();

          const { flattenHandlers, unsupportedHandlers } =
            initMSWDevToolStore(runtime);

          set({
            runtime,
            flattenHandlers,
            restHandlers: unsupportedHandlers,
          });
        },
        addTempHandler: ({ data }) => {
          const { handler, flattenHandler } = buildTempHandler(
            data,
            lookupBehavior,
            lookupCustomResponse
          );
          const runtime = get().getRuntime();
          const flattenHandlers = appendFlattenHandler(
            get().flattenHandlers,
            flattenHandler
          );
          runtime.use(handler);

          set({
            runtime,
            flattenHandlers,
          });
        },
        getRuntime: () => {
          const runtime = get().runtime;
          if (!runtime) {
            throw new Error("MSW Dev Tool runtime is not initialized");
          }
          return runtime;
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
        getHandlerCustomResponse: (id) => lookupCustomResponse(id),
        setHandlerCustomResponse: (id, response) => {
          set({
            flattenHandlers: applyHandlerCustomResponse(
              get().flattenHandlers,
              id,
              response
            ),
          });
        },
        removeTempHandler: (id) => {
          const runtime = get().getRuntime();
          const flattenHandlers = removeTempHandlerFromList(
            get().flattenHandlers,
            id
          );

          runtime.resetHandlers();
          registerTempHandlers(runtime, flattenHandlers);

          set({
            runtime,
            flattenHandlers,
          });
        },
      };
    },
    options.persist
  );

  return store;
};

export { registerTempHandlers };
