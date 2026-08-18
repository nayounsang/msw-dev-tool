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
import { bindWebSocketHandler } from "../websocket/bind";
import { createHandlerRegistry } from "./commonSlice";
import {
  createWebSocketSlice,
  managedEndpointToInfo,
  managedListenerToInfo,
} from "./webSocketSlice";
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
      const registry = createHandlerRegistry();
      const webSocketSlice = createWebSocketSlice(options.webSocketRuntime);
      const syncWebSocketState = (extra: Partial<HandlerStoreInternalState<TRuntime>> = {}) => {
        const webSocket = webSocketSlice.getState();
        set({ ...extra,
          common: registry.getState(),
          webSocket,
          webSocketEndpoints: webSocket.endpoints.map((entry) => ({ id: entry.endpointId, endpoint: entry.info.endpoint, source: entry.info.source === "code" ? "code" : "code" })),
          webSocketListeners: webSocket.listeners.map((entry, order) => ({ id: entry.info.id, endpointId: entry.endpointId, order, event: entry.event, source: entry.info.source === "code" ? "code" : "code" })),
        });
      };
      const registerHttpHandlers = (handlers: FlattenHandler[]) => {
        handlers.forEach((handler) => registry.registerHandler({
          id: handler.id,
          kind: "http",
          endpoint: handler.path,
          operation: handler.method,
          source: handler.type === "temp" ? "temp" : "code",
        }));
      };
      const lookupBehavior = (id: string) =>
        findHandlerBehavior(get().flattenHandlers, id);
      const lookupCustomResponse = (id: string) =>
        findHandlerCustomResponse(get().flattenHandlers, id);

      const bindWebSocketHandlers = (handlers: readonly unknown[]) => {
        const adapter = {
          registerCodeWebSocketEndpoint: (endpoint: import("../types").ManagedWebSocketEndpoint) => {
            webSocketSlice.registerCodeEndpoint({ info: managedEndpointToInfo(endpoint), matcher: endpoint.matcher ?? { kind: "string", value: endpoint.endpoint } });
            registry.registerHandler(managedEndpointToInfo(endpoint));
            syncWebSocketState();
          },
          registerCodeWebSocketListener: (listener: import("../types").ManagedWebSocketListener) => {
            webSocketSlice.registerCodeListener({ info: managedListenerToInfo(listener), endpointId: listener.endpointId, event: listener.event });
            registry.registerHandler(managedListenerToInfo(listener));
            syncWebSocketState();
          },
        };
        handlers.forEach((handler) => bindWebSocketHandler(handler, adapter));
      };

      return {
        flattenHandlers: [],
        common: registry.getState(),
        webSocket: webSocketSlice.getState(),
        runtime: null,
        restHandlers: [],
        webSocketEndpoints: [],
        webSocketListeners: [],
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
            webSocketEndpoints: [],
            webSocketListeners: [],
          });
          webSocketSlice.replace([]);
          registry.replace([]);
          registerHttpHandlers(rehydratedHandlers);
          bindWebSocketHandlers(handlers);
          const persisted = options.getStoredWebSocketState?.();
          if (persisted) {
            webSocketSlice.hydrate(persisted);
            persisted.flatMap((entry) => entry.listeners).forEach((listener) => registry.registerHandler(listener.info));
            persisted.forEach((entry) => registry.registerHandler(entry.info));
          }
          syncWebSocketState();

          return runtime;
        },
        resetMSWDevTool: () => {
          const runtime = get().getRuntime();
          runtime.resetHandlers();

          const { flattenHandlers, unsupportedHandlers } =
            initMSWDevToolStore(runtime);

          webSocketSlice.reset();
          registry.replace(registry.getState().handlers.filter((entry) => entry.source === "code"));
          registerHttpHandlers(flattenHandlers);
          bindWebSocketHandlers(runtime.listHandlers());
          syncWebSocketState({ runtime, flattenHandlers, restHandlers: unsupportedHandlers });
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

          registry.registerHandler({ id: flattenHandler.id, kind: "http", endpoint: flattenHandler.path, operation: flattenHandler.method, source: "temp" });
          syncWebSocketState({ runtime, flattenHandlers });
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

          registry.unregisterHandler(id);
          syncWebSocketState({ runtime, flattenHandlers });
        },
        registerCodeWebSocketEndpoint: (endpoint) => {
          webSocketSlice.registerCodeEndpoint({ info: managedEndpointToInfo(endpoint), matcher: endpoint.matcher ?? { kind: "string", value: endpoint.endpoint } });
          registry.registerHandler(managedEndpointToInfo(endpoint));
          syncWebSocketState();
        },
        registerCodeWebSocketListener: (listener) => {
          webSocketSlice.registerCodeListener({ info: managedListenerToInfo(listener), endpointId: listener.endpointId, event: listener.event });
          registry.registerHandler(managedListenerToInfo(listener));
          syncWebSocketState();
        },
        registerHandler: (info) => { registry.registerHandler(info); syncWebSocketState(); },
        unregisterHandler: (id) => { registry.unregisterHandler(id); syncWebSocketState(); },
        getHandlerInfo: (id) => registry.getHandlerInfo(id),
        listHandlerInfo: (kind) => registry.listHandlerInfo(kind),
        addTempWebSocketEndpoint: (input) => { const id = webSocketSlice.addTempEndpoint(input); const info = webSocketSlice.getState().endpoints.find((entry) => entry.endpointId === id)?.info; if (info) registry.registerHandler(info); syncWebSocketState(); return id; },
        addTempWebSocketListener: (input) => { const id = webSocketSlice.addTempListener(input); const info = webSocketSlice.getState().listeners.find((entry) => entry.info.id === id)?.info; if (info) registry.registerHandler(info); syncWebSocketState(); return id; },
        removeWebSocketEndpoint: (id) => { const endpoint = webSocketSlice.getState().endpoints.find((entry) => entry.endpointId === id); webSocketSlice.removeEndpoint(id); if (endpoint) { registry.unregisterHandler(id); endpoint.listeners.forEach((listener) => registry.unregisterHandler(listener.info.id)); } syncWebSocketState(); },
        removeWebSocketListener: (id) => { webSocketSlice.removeListener(id); registry.unregisterHandler(id); syncWebSocketState(); },
        setWebSocketEndpointEnabled: (id, enabled) => { webSocketSlice.setEndpointEnabled(id, enabled); syncWebSocketState(); },
        setWebSocketListenerEnabled: (id, enabled) => { webSocketSlice.setListenerEnabled(id, enabled); syncWebSocketState(); },
        setWebSocketListenerBehavior: (id, behavior) => { webSocketSlice.setListenerBehavior(id, behavior); syncWebSocketState(); },
        hydrateWebSocket: (endpoints) => { webSocketSlice.hydrate(endpoints); endpoints.forEach((endpoint) => { registry.registerHandler(endpoint.info); endpoint.listeners.forEach((listener) => registry.registerHandler(listener.info)); }); syncWebSocketState(); },
        getWebSocketEndpoint: (id) => webSocketSlice.getState().endpoints.find((entry) => entry.endpointId === id),
        getWebSocketListener: (id) => webSocketSlice.getState().listeners.find((entry) => entry.info.id === id),
      };
    },
    options.persist
  );

  return store;
};

export { registerTempHandlers };
