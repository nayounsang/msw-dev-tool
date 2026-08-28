import {
  appendFlattenHandler,
  buildTempHandler,
  getFlattenHandlerById as findFlattenHandlerById,
  getHandlerBehavior as findHandlerBehavior,
  getHandlerCustomResponse as findHandlerCustomResponse,
  rehydrateTempHandlers,
  removeTempHandler as removeTempHandlerFromList,
  setHandlerBehavior as applyHandlerBehavior,
  setHandlerEnabled as applyHandlerEnabled,
  setHandlerCustomResponse as applyHandlerCustomResponse,
  wrapHandlersWithBehavior,
} from "../domain";
import { FlattenHandler, Handler } from "../types";
import type { WebSocketData } from "msw";
import { deleteEmptySet, initMSWDevToolStore } from "../utils";
import {
  bindWebSocketHandler,
  type ManagedWebSocketClient,
  type WebSocketMessageListenerRegistration,
} from "../websocket/bind";
import { createTemporaryWebSocketHandler } from "../../msw/websocket";
import { webSocketEndpointsSchema } from "../schema/websocket";
import { webSocketCloseOptionsSchema, webSocketSendOptionsSchema } from "../schema/websocket";
import { CUSTOM_WEBSOCKET_RESPONSE_ERROR, toWebSocketSendData } from "../websocket/response";
import { createHandlerRegistry } from "./commonSlice";
import {
  createWebSocketSlice,
  managedEndpointToInfo,
  managedListenerToInfo,
} from "./webSocketSlice";
import { createStore, StoreApi } from "./createStore";
import { CreateHandlerStoreOptions, HandlerStoreInternalState, MswDevToolRuntime } from "./types";

export type {
  CreateHandlerStoreOptions,
  HandlerStoreBaseState,
  HandlerStoreInternalState,
  MswDevToolRuntime,
} from "./types";

const isWebSocketMessageEvent = (event: Event): event is MessageEvent<WebSocketData> =>
  "data" in event;

const registerTempHandlers = (runtime: MswDevToolRuntime, flattenHandlers: FlattenHandler[]) => {
  const tempHandlers = flattenHandlers
    .filter((handler) => handler.type === "temp")
    .map((handler) => handler.handler);
  if (tempHandlers.length > 0) {
    runtime.use(...tempHandlers);
  }
};

export const createHandlerStore = <TRuntime extends MswDevToolRuntime>(
  options: CreateHandlerStoreOptions<TRuntime>,
): StoreApi<HandlerStoreInternalState<TRuntime>> => {
  const store = createStore<HandlerStoreInternalState<TRuntime>>((set, get) => {
    const registry = createHandlerRegistry();
    const connections = new Map<string, Set<ManagedWebSocketClient>>();
    const reconnectors = new Map<string, Set<WebSocketMessageListenerRegistration>>();
    const sequenceTimers = new WeakMap<object, Set<ReturnType<typeof setTimeout>>>();
    type ResponseSchedule = { timer?: ReturnType<typeof setTimeout>; cancelled: boolean };
    const responseSchedules = new WeakMap<object, Map<string, Set<ResponseSchedule>>>();
    const clearResponseTimers = (client: object, listenerId?: string) => {
      const schedules = responseSchedules.get(client);
      if (!schedules) return;
      const entries = listenerId ? [schedules.get(listenerId)] : [...schedules.values()];
      entries.forEach((set) =>
        set?.forEach((schedule) => {
          schedule.cancelled = true;
          if (schedule.timer) clearTimeout(schedule.timer);
        }),
      );
      if (listenerId) schedules.delete(listenerId);
      else responseSchedules.delete(client);
    };
    const clearSequenceTimers = (client: object) => {
      sequenceTimers.get(client)?.forEach((timer) => clearTimeout(timer));
      sequenceTimers.delete(client);
      clearResponseTimers(client);
    };
    const clearListenerTimers = (listenerId: string) => {
      connections.forEach((clients) =>
        clients.forEach((client) => {
          const schedules = responseSchedules.get(client);
          if (!schedules) return;
          [...schedules.keys()]
            .filter((key) => key === listenerId || key.startsWith(`${listenerId}:`))
            .forEach((key) => clearResponseTimers(client, key));
        }),
      );
    };
    const closeConnections = (id: string) => {
      connections.get(id)?.forEach((client) => {
        clearSequenceTimers(client);
        client.close();
      });
      connections.delete(id);
      reconnectors.delete(id);
    };
    const closeAllConnections = () => [...connections.keys()].forEach(closeConnections);
    const temporaryHandlers = new Map<string, unknown>();
    let codeWebSocketHandlers: readonly Handler[] = [];
    const webSocketSlice = createWebSocketSlice({
      ...options.webSocketRuntime,
      closeEndpointConnections: (id) => {
        closeConnections(id);
        options.webSocketRuntime?.closeEndpointConnections?.(id);
      },
    });
    const webSocketAdapter = {
      registerCodeWebSocketEndpoint: (endpoint: import("../types").ManagedWebSocketEndpoint) => {
        webSocketSlice.registerCodeEndpoint({
          info: managedEndpointToInfo(endpoint),
          matcher: endpoint.matcher ?? { kind: "string", value: endpoint.endpoint },
        });
        registry.registerHandler(managedEndpointToInfo(endpoint));
        syncWebSocketState();
      },
      registerCodeWebSocketListener: (listener: import("../types").ManagedWebSocketListener) => {
        const endpoint = webSocketSlice
          .getState()
          .endpoints.find((entry) => entry.endpointId === listener.endpointId);
        const info = managedListenerToInfo(listener, endpoint?.info.endpoint);
        webSocketSlice.registerCodeListener({
          info,
          endpointId: listener.endpointId,
          event: listener.event,
          eventTypes: listener.eventTypes,
        });
        registry.registerHandler(info);
        syncWebSocketState();
        options.onWebSocketStateChange?.(webSocketSlice.getState().endpoints);
      },
      getWebSocketEndpoint: (id: string) =>
        webSocketSlice.getState().endpoints.find((entry) => entry.endpointId === id),
      getWebSocketListener: (id: string) =>
        webSocketSlice.getState().listeners.find((entry) => entry.info.id === id),
      registerWebSocketConnection: (id: string, client: ManagedWebSocketClient) => {
        let set = connections.get(id);
        if (!set) {
          set = new Set();
          connections.set(id, set);
        }
        set.add(client);
      },
      unregisterWebSocketConnection: (id: string, client: ManagedWebSocketClient) => {
        clearSequenceTimers(client);
        const set = connections.get(id);
        if (!set) return;
        set.delete(client);
        deleteEmptySet(connections, id, set);
      },
      registerWebSocketMessageListener: (
        id: string,
        registration: WebSocketMessageListenerRegistration,
      ) => {
        let set = reconnectors.get(id);
        if (!set) {
          set = new Set();
          reconnectors.set(id, set);
        }
        set.add(registration);
      },
      unregisterWebSocketMessageListener: (
        id: string,
        registration: WebSocketMessageListenerRegistration,
      ) => {
        const set = reconnectors.get(id);
        if (!set) return;
        set.delete(registration);
        deleteEmptySet(reconnectors, id, set);
      },
      connectWebSocket: (_id: string, server: { connect: () => void }) => server.connect(),
      isMockEnabled: () => get().mockEnabled,
      dispatchWebSocketMessage: (
        endpointId: string,
        client: ManagedWebSocketClient,
        event: Event,
        listenerId?: string,
        original?: (event: Event) => void,
        eventType?: string,
      ) => {
        const endpoint = webSocketSlice
          .getState()
          .endpoints.find((entry) => entry.endpointId === endpointId);
        if (!get().mockEnabled || !endpoint?.enabled) return;
        const listeners = listenerId
          ? [webSocketSlice.getState().listeners.find((entry) => entry.info.id === listenerId)]
          : endpoint.listeners;
        listeners.forEach((config) => {
          if (!config?.enabled) return;
          const branch = eventType
            ? config.eventBranches?.find((entry) => entry.eventType === eventType)
            : undefined;
          if (eventType && !branch) {
            original?.(event);
            return;
          }
          if (branch && !branch.enabled) return;
          const controlled = branch ?? config;
          const defaultAction = controlled.behavior;
          const sendResponse = (response: import("../types").WebSocketResponseConfig) => {
            const schedules =
              responseSchedules.get(client) ?? new Map<string, Set<ResponseSchedule>>();
            responseSchedules.set(client, schedules);
            const scheduleId = eventType ? `${config.info.id}:${eventType}` : config.info.id;
            const listenerSchedules = schedules.get(scheduleId) ?? new Set<ResponseSchedule>();
            schedules.set(scheduleId, listenerSchedules);
            const repetitions = response.repeat?.repetitions ?? 1;
            const interval = response.repeat?.interval ?? 0;
            let count = 0;
            const schedule: ResponseSchedule = { cancelled: false };
            const run = () => {
              if (schedule.cancelled) return;
              if (response.type === "send") client.send(toWebSocketSendData(response));
              else client.close(response.code, response.reason);
              count += 1;
              listenerSchedules.delete(schedule);
              if (
                response.type === "close" ||
                (repetitions !== "Infinity" && count >= repetitions) ||
                schedule.cancelled
              ) {
                if (listenerSchedules.size === 0) schedules.delete(scheduleId);
                return;
              }
              schedule.timer = setTimeout(run, interval);
              listenerSchedules.add(schedule);
            };
            listenerSchedules.add(schedule);
            if (!response.delay) run();
            else schedule.timer = setTimeout(run, response.delay);
          };
          if (defaultAction.preset === "default") {
            if (controlled.response) sendResponse(controlled.response);
            else original?.(event);
            return;
          }
          if (defaultAction.preset === "send") {
            const options = webSocketSendOptionsSchema.safeParse(defaultAction.options);
            if (options.success) client.send(options.data.message);
            return;
          }
          if (defaultAction.preset === "close") {
            const options = webSocketCloseOptionsSchema.safeParse(defaultAction.options);
            if (options.success) client.close(options.data.code, options.data.reason);
            return;
          }
          if (defaultAction.preset === "echo") {
            if (isWebSocketMessageEvent(event)) client.send(event.data);
            return;
          }
          if (defaultAction.preset === "send-null") {
            client.send("null");
            return;
          }
          if (defaultAction.preset === "no-reply") {
            return;
          }
          if (defaultAction.preset === "send-sequence") {
            const message = "Test message from MSW Dev Tool";
            client.send(message);
            const timers = sequenceTimers.get(client) ?? new Set<ReturnType<typeof setTimeout>>();
            sequenceTimers.set(client, timers);
            [1_000, 2_000].forEach((delay) => {
              const timer = setTimeout(() => {
                timers.delete(timer);
                client.send(message);
              }, delay);
              timers.add(timer);
            });
          }
          if (defaultAction.preset === "custom response") {
            const response = controlled.customResponse;
            if (!response) throw new Error(CUSTOM_WEBSOCKET_RESPONSE_ERROR);
            sendResponse(response);
          }
        });
      },
      closeWebSocketConnections: (id: string) => {
        closeConnections(id);
      },
      resetWebSocketConnections: () => {
        connections.forEach((clients) => clients.forEach(clearSequenceTimers));
        reconnectors.forEach((listeners) =>
          listeners.forEach(({ disconnect, reconnect }) => {
            disconnect?.();
            reconnect();
          }),
        );
      },
    };
    const syncWebSocketState = (extra: Partial<HandlerStoreInternalState<TRuntime>> = {}) => {
      const webSocket = webSocketSlice.getState();
      set({
        ...extra,
        common: registry.getState(),
        webSocket,
        webSocketEndpoints: webSocket.endpoints
          .filter((entry) => entry.info.source === "code")
          .map((entry) => ({
            id: entry.endpointId,
            endpoint: entry.info.endpoint,
            source: "code" as const,
          })),
        webSocketListeners: webSocket.listeners
          .filter((entry) => entry.info.source === "code")
          .map((entry, order) => ({
            id: entry.info.id,
            endpointId: entry.endpointId,
            order,
            event: entry.event,
            source: "code" as const,
          })),
      });
    };
    const registerHttpHandlers = (handlers: FlattenHandler[]) => {
      handlers.forEach((handler) =>
        registry.registerHandler({
          id: handler.id,
          kind: "http",
          endpoint: handler.path,
          operation: handler.method,
          source: handler.type === "temp" ? "temp" : "code",
        }),
      );
    };
    const lookupBehavior = (id: string) => findHandlerBehavior(get().flattenHandlers, id);
    const lookupEnabled = (id: string) =>
      findFlattenHandlerById(get().flattenHandlers, id)?.enabled ?? true;
    const lookupCustomResponse = (id: string) =>
      findHandlerCustomResponse(get().flattenHandlers, id);

    const bindWebSocketHandlers = (handlers: readonly unknown[]) => {
      handlers.forEach((handler) => bindWebSocketHandler(handler, webSocketAdapter));
    };
    const installTempEndpoint = (
      config: import("../types").WebSocketEndpointConfig,
      runtime: TRuntime,
    ) => {
      const matcher =
        config.matcher.kind === "string"
          ? config.matcher.value
          : new RegExp(config.matcher.source, config.matcher.flags);
      const handler = createTemporaryWebSocketHandler(matcher, config.endpointId, webSocketAdapter);
      temporaryHandlers.set(config.endpointId, handler);
      runtime.use(handler);
    };
    const rebuildRuntimeWebSocketHandlers = (
      runtime: TRuntime,
      flattenHandlers = get().flattenHandlers,
    ) => {
      runtime.resetHandlers();
      registerTempHandlers(runtime, flattenHandlers);
      bindWebSocketHandlers(runtime.listHandlers());
      temporaryHandlers.clear();
      webSocketSlice
        .getState()
        .endpoints.filter((entry) => entry.info.source === "temp")
        .forEach((entry) => installTempEndpoint(entry, runtime));
    };

    return {
      flattenHandlers: [],
      mockEnabled: true,
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
          lookupCustomResponse,
          lookupEnabled,
          () => get().mockEnabled,
        );
        const runtime = options.createRuntime(wrapped);

        const { flattenHandlers, unsupportedHandlers } = initMSWDevToolStore(runtime);

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
          lookupCustomResponse,
          lookupEnabled,
          () => get().mockEnabled,
        );
        registerTempHandlers(runtime, rehydratedHandlers);

        // Must run before the first persist triggered by `set`.
        options.onSetup?.({
          runtime,
          flattenHandlers: rehydratedHandlers,
        });

        const persistedValue = options.getStoredWebSocketState?.();
        const persisted =
          persistedValue === undefined ? undefined : webSocketEndpointsSchema.parse(persistedValue);

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
        codeWebSocketHandlers = handlers;
        if (persisted) {
          webSocketSlice.hydrate(persisted);
          const hydrated = webSocketSlice.getState();
          hydrated.endpoints
            .flatMap((entry) => [entry.info, ...entry.listeners.map((listener) => listener.info)])
            .forEach((info) => registry.registerHandler(info));
          webSocketSlice
            .getState()
            .endpoints.filter((entry) => entry.info.source === "temp")
            .forEach((entry) => installTempEndpoint(entry, runtime));
        }
        syncWebSocketState();

        return runtime;
      },
      resetMSWDevTool: () => {
        const runtime = get().getRuntime();
        runtime.resetHandlers();

        const { flattenHandlers, unsupportedHandlers } = initMSWDevToolStore(runtime);

        webSocketAdapter.resetWebSocketConnections();
        temporaryHandlers.clear();
        webSocketSlice.reset();
        registry.replace(registry.getState().handlers.filter((entry) => entry.source === "code"));
        registerHttpHandlers(flattenHandlers);
        if (codeWebSocketHandlers.length > 0) runtime.use(...codeWebSocketHandlers);
        bindWebSocketHandlers(
          codeWebSocketHandlers.length > 0 ? codeWebSocketHandlers : runtime.listHandlers(),
        );
        syncWebSocketState({
          runtime,
          flattenHandlers,
          restHandlers: unsupportedHandlers,
          mockEnabled: true,
        });
      },
      addTempHandler: ({ data }) => {
        const { handler, flattenHandler } = buildTempHandler(
          data,
          lookupBehavior,
          lookupCustomResponse,
          lookupEnabled,
          () => get().mockEnabled,
        );
        const runtime = get().getRuntime();
        const flattenHandlers = appendFlattenHandler(get().flattenHandlers, flattenHandler);
        runtime.use(handler);

        registry.registerHandler({
          id: flattenHandler.id,
          kind: "http",
          endpoint: flattenHandler.path,
          operation: flattenHandler.method,
          source: "temp",
        });
        syncWebSocketState({ runtime, flattenHandlers });
      },
      getRuntime: () => {
        const runtime = get().runtime;
        if (!runtime) {
          throw new Error("MSW Dev Tool runtime is not initialized");
        }
        return runtime;
      },
      getFlattenHandlerById: (id) => findFlattenHandlerById(get().flattenHandlers, id),
      getHandlerBehavior: (id) => lookupBehavior(id),
      setHandlerBehavior: (id, behavior) => {
        set({
          flattenHandlers: applyHandlerBehavior(get().flattenHandlers, id, behavior),
        });
      },
      setHandlerEnabled: (id, enabled) => {
        set({ flattenHandlers: applyHandlerEnabled(get().flattenHandlers, id, enabled) });
      },
      setMockEnabled: (enabled) => {
        if (!enabled) closeAllConnections();
        set({ mockEnabled: enabled });
      },
      setWebSocketListenerCustomResponse: (listenerId, response) => {
        clearListenerTimers(listenerId);
        webSocketSlice.setListenerCustomResponse(listenerId, response);
        syncWebSocketState();
      },
      setWebSocketListenerResponse: (listenerId, response) => {
        clearListenerTimers(listenerId);
        webSocketSlice.setListenerResponse(listenerId, response);
        syncWebSocketState();
      },
      setWebSocketListenerEventBehavior: (listenerId, eventType, behavior) => {
        clearListenerTimers(`${listenerId}:${eventType}`);
        webSocketSlice.setListenerEventBehavior(listenerId, eventType, behavior);
        syncWebSocketState();
      },
      setWebSocketListenerEventEnabled: (listenerId, eventType, enabled) => {
        if (!enabled) clearListenerTimers(`${listenerId}:${eventType}`);
        webSocketSlice.setListenerEventEnabled(listenerId, eventType, enabled);
        syncWebSocketState();
      },
      setWebSocketListenerEventCustomResponse: (listenerId, eventType, response) => {
        clearListenerTimers(`${listenerId}:${eventType}`);
        webSocketSlice.setListenerEventCustomResponse(listenerId, eventType, response);
        syncWebSocketState();
      },
      setWebSocketListenerEventResponse: (listenerId, eventType, response) => {
        clearListenerTimers(`${listenerId}:${eventType}`);
        webSocketSlice.setListenerEventResponse(listenerId, eventType, response);
        syncWebSocketState();
      },
      getHandlerCustomResponse: (id) => lookupCustomResponse(id),
      setHandlerCustomResponse: (id, response) => {
        set({
          flattenHandlers: applyHandlerCustomResponse(get().flattenHandlers, id, response),
        });
      },
      removeTempHandler: (id) => {
        const runtime = get().getRuntime();
        const flattenHandlers = removeTempHandlerFromList(get().flattenHandlers, id);

        registry.unregisterHandler(id);
        rebuildRuntimeWebSocketHandlers(runtime, flattenHandlers);
        syncWebSocketState({ runtime, flattenHandlers });
      },
      registerCodeWebSocketEndpoint: (endpoint) => {
        webSocketSlice.registerCodeEndpoint({
          info: managedEndpointToInfo(endpoint),
          matcher: endpoint.matcher ?? { kind: "string", value: endpoint.endpoint },
        });
        registry.registerHandler(managedEndpointToInfo(endpoint));
        syncWebSocketState();
      },
      registerCodeWebSocketListener: (listener) => {
        const endpoint = webSocketSlice
          .getState()
          .endpoints.find((entry) => entry.endpointId === listener.endpointId);
        const info = managedListenerToInfo(listener, endpoint?.info.endpoint);
        webSocketSlice.registerCodeListener({
          info,
          endpointId: listener.endpointId,
          event: listener.event,
          eventTypes: listener.eventTypes,
        });
        registry.registerHandler(info);
        syncWebSocketState();
      },
      registerHandler: (info) => {
        registry.registerHandler(info);
        syncWebSocketState();
      },
      unregisterHandler: (id) => {
        registry.unregisterHandler(id);
        syncWebSocketState();
      },
      getHandlerInfo: (id) => registry.getHandlerInfo(id),
      listHandlerInfo: (kind) => registry.listHandlerInfo(kind),
      addTempWebSocketEndpoint: (input) => {
        const id = webSocketSlice.addTempEndpoint(input);
        const endpoint = webSocketSlice
          .getState()
          .endpoints.find((entry) => entry.endpointId === id);
        const info = endpoint?.info;
        if (info) {
          registry.registerHandler(info);
          installTempEndpoint(endpoint!, get().getRuntime());
        }
        syncWebSocketState();
        return id;
      },
      addTempWebSocketListener: (input) => {
        const id = webSocketSlice.addTempListener(input);
        const info = webSocketSlice
          .getState()
          .listeners.find((entry) => entry.info.id === id)?.info;
        if (info) registry.registerHandler(info);
        syncWebSocketState();
        return id;
      },
      removeWebSocketEndpoint: (id) => {
        const endpoint = webSocketSlice
          .getState()
          .endpoints.find((entry) => entry.endpointId === id);
        closeConnections(id);
        webSocketSlice.removeEndpoint(id);
        if (endpoint) {
          registry.unregisterHandler(id);
          endpoint.listeners.forEach((listener) => registry.unregisterHandler(listener.info.id));
        }
        const runtime = get().runtime;
        if (runtime) rebuildRuntimeWebSocketHandlers(runtime);
        syncWebSocketState();
      },
      removeWebSocketListener: (id) => {
        clearListenerTimers(id);
        webSocketSlice.removeListener(id);
        registry.unregisterHandler(id);
        syncWebSocketState();
      },
      setWebSocketEndpointEnabled: (id, enabled) => {
        if (!enabled) closeConnections(id);
        webSocketSlice.setEndpointEnabled(id, enabled);
        syncWebSocketState();
      },
      setWebSocketListenerEnabled: (id, enabled) => {
        if (!enabled) clearListenerTimers(id);
        webSocketSlice.setListenerEnabled(id, enabled);
        syncWebSocketState();
      },
      setWebSocketListenerBehavior: (id, behavior) => {
        clearListenerTimers(id);
        webSocketSlice.setListenerBehavior(id, behavior);
        syncWebSocketState();
      },
      hydrateWebSocket: (endpoints) => {
        connections.forEach((clients) => clients.forEach(clearSequenceTimers));
        registry.clearTempHandlers("websocket");
        webSocketSlice.hydrate(endpoints);
        const hydrated = webSocketSlice.getState();
        hydrated.endpoints
          .flatMap((entry) => [entry.info, ...entry.listeners.map((listener) => listener.info)])
          .forEach((info) => registry.registerHandler(info));
        const runtime = get().runtime;
        if (runtime) rebuildRuntimeWebSocketHandlers(runtime);
        syncWebSocketState();
      },
      getWebSocketEndpoint: (id) =>
        webSocketSlice.getState().endpoints.find((entry) => entry.endpointId === id),
      getWebSocketListener: (id) =>
        webSocketSlice.getState().listeners.find((entry) => entry.info.id === id),
    };
  }, options.persist);

  return store;
};

export { registerTempHandlers };
