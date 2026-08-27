import type {
  ManagedWebSocketEndpoint,
  ManagedWebSocketListener,
  SerializableWebSocketMatcher,
  WebSocketBehaviorSelection,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
  WebSocketHandlerInfo,
  WebSocketResponseConfig,
  AddWebSocketListenerInput,
} from "../types";
import {
  addTemporaryWebSocketEndpoint,
  addTemporaryWebSocketListener,
  removeTemporaryWebSocketEndpoint,
  removeTemporaryWebSocketListener,
  resetWebSocketEndpoints,
  setWebSocketEndpointEnabled,
  setWebSocketListenerBehavior,
  setWebSocketListenerCustomResponse,
  setWebSocketListenerResponse,
  setWebSocketListenerEnabled,
  setWebSocketListenerEventBehavior,
  setWebSocketListenerEventEnabled,
  setWebSocketListenerEventCustomResponse,
  setWebSocketListenerEventResponse,
  reconcileCodeWebSocketListener,
} from "../websocket/state";
import { webSocketEndpointsSchema } from "../schema/websocket";

export type WebSocketRuntimeAdapter = {
  addTempEndpoint?: (config: WebSocketEndpointConfig) => void;
  removeEndpoint?: (endpointId: string) => void;
  closeEndpointConnections?: (endpointId: string) => void;
  resetTempEndpoints?: () => void;
};

export type WebSocketStoreState = {
  endpoints: WebSocketEndpointConfig[];
  listeners: WebSocketListenerConfig[];
};

const defaultBehavior: WebSocketBehaviorSelection = { preset: "default" };
export {
  canonicalWebSocketMatcher,
  createWebSocketEndpointId,
  createWebSocketListenerId,
} from "../websocket/state";

export const createWebSocketSlice = (runtime?: WebSocketRuntimeAdapter) => {
  let state: WebSocketStoreState = { endpoints: [], listeners: [] };
  const getEndpoint = (id: string) => state.endpoints.find((entry) => entry.endpointId === id);
  const getListener = (id: string) => state.listeners.find((entry) => entry.info.id === id);
  const set = (next: WebSocketStoreState) => {
    state = next;
  };
  const registerListener = (listener: WebSocketListenerConfig) => {
    const existing = getListener(listener.info.id);
    if (existing) {
      const updated = reconcileCodeWebSocketListener(existing, listener);
      set({
        endpoints: state.endpoints.map((endpoint) => ({
          ...endpoint,
          listeners: endpoint.listeners.map((entry) =>
            entry.info.id === updated.info.id ? updated : entry,
          ),
        })),
        listeners: state.listeners.map((entry) =>
          entry.info.id === updated.info.id ? updated : entry,
        ),
      });
      return;
    }
    const endpoint = getEndpoint(listener.endpointId);
    if (!endpoint) return;
    set({
      endpoints: state.endpoints.map((entry) =>
        entry.endpointId === endpoint.endpointId
          ? { ...entry, listeners: [...entry.listeners, listener] }
          : entry,
      ),
      listeners: [...state.listeners, listener],
    });
  };

  return {
    getState: () => state,
    registerCodeEndpoint: (input: {
      info: WebSocketHandlerInfo;
      matcher: SerializableWebSocketMatcher;
    }) => {
      if (state.endpoints.some((entry) => entry.endpointId === input.info.id)) return;
      set({
        ...state,
        endpoints: [
          ...state.endpoints,
          {
            info: input.info,
            endpointId: input.info.id,
            matcher: input.matcher,
            enabled: true,
            listeners: [],
          },
        ],
      });
    },
    registerCodeListener: (input: {
      info: WebSocketHandlerInfo;
      endpointId: string;
      event: "message";
      eventTypes?: readonly string[];
    }) => {
      const eventBranches = input.eventTypes?.map((eventType) => ({
        eventType,
        enabled: true,
        behavior: defaultBehavior,
      }));
      registerListener({ ...input, enabled: true, behavior: defaultBehavior, eventBranches });
    },
    addTempEndpoint: (input: { matcher: SerializableWebSocketMatcher; endpoint: string }) => {
      const next = addTemporaryWebSocketEndpoint(state.endpoints, input.matcher, input.endpoint);
      set({ ...state, endpoints: next.endpoints });
      runtime?.addTempEndpoint?.(next.endpoint);
      return next.endpoint.endpointId;
    },
    addTempListener: (input: AddWebSocketListenerInput) => {
      const next = addTemporaryWebSocketListener(state.endpoints, input.endpointId, input);
      set({ endpoints: next.endpoints, listeners: [...state.listeners, next.listener] });
      return next.listener.info.id;
    },
    removeEndpoint: (endpointId: string) => {
      const next = removeTemporaryWebSocketEndpoint(state.endpoints, endpointId);
      runtime?.closeEndpointConnections?.(endpointId);
      runtime?.removeEndpoint?.(endpointId);
      const listenerIds = new Set(next.endpoint.listeners.map((entry) => entry.info.id));
      set({
        endpoints: next.endpoints,
        listeners: state.listeners.filter((entry) => !listenerIds.has(entry.info.id)),
      });
    },
    removeListener: (listenerId: string) => {
      const next = removeTemporaryWebSocketListener(state.endpoints, listenerId);
      set({
        endpoints: next.endpoints,
        listeners: state.listeners.filter((entry) => entry.info.id !== listenerId),
      });
    },
    setEndpointEnabled: (endpointId: string, enabled: boolean) => {
      const next = setWebSocketEndpointEnabled(state.endpoints, endpointId, enabled);
      if (!enabled) runtime?.closeEndpointConnections?.(endpointId);
      set({ ...state, endpoints: next.endpoints });
    },
    setListenerEnabled: (listenerId: string, enabled: boolean) => {
      const next = setWebSocketListenerEnabled(state.endpoints, listenerId, enabled);
      set({
        endpoints: next.endpoints,
        listeners: state.listeners.map((entry) =>
          entry.info.id === listenerId ? next.listener : entry,
        ),
      });
    },
    setListenerBehavior: (listenerId: string, behavior: WebSocketBehaviorSelection) => {
      const next = setWebSocketListenerBehavior(state.endpoints, listenerId, behavior);
      set({
        endpoints: next.endpoints,
        listeners: state.listeners.map((entry) =>
          entry.info.id === listenerId ? next.listener : entry,
        ),
      });
    },
    setListenerCustomResponse: (listenerId: string, customResponse: WebSocketResponseConfig) => {
      const next = setWebSocketListenerCustomResponse(state.endpoints, listenerId, customResponse);
      set({
        endpoints: next.endpoints,
        listeners: state.listeners.map((entry) =>
          entry.info.id === listenerId ? next.listener : entry,
        ),
      });
    },
    setListenerResponse: (listenerId: string, response: WebSocketResponseConfig) => {
      const next = setWebSocketListenerResponse(state.endpoints, listenerId, response);
      set({
        endpoints: next.endpoints,
        listeners: state.listeners.map((entry) =>
          entry.info.id === listenerId ? next.listener : entry,
        ),
      });
    },
    setListenerEventBehavior: (
      listenerId: string,
      eventType: string,
      behavior: WebSocketBehaviorSelection,
    ) => {
      const next = setWebSocketListenerEventBehavior(
        state.endpoints,
        listenerId,
        eventType,
        behavior,
      );
      set({
        endpoints: next.endpoints,
        listeners: next.endpoints.flatMap((entry) => entry.listeners),
      });
      return next.eventBranch;
    },
    setListenerEventEnabled: (listenerId: string, eventType: string, enabled: boolean) => {
      const next = setWebSocketListenerEventEnabled(
        state.endpoints,
        listenerId,
        eventType,
        enabled,
      );
      set({
        endpoints: next.endpoints,
        listeners: next.endpoints.flatMap((entry) => entry.listeners),
      });
      return next.eventBranch;
    },
    setListenerEventCustomResponse: (
      listenerId: string,
      eventType: string,
      response: WebSocketResponseConfig,
    ) => {
      const next = setWebSocketListenerEventCustomResponse(
        state.endpoints,
        listenerId,
        eventType,
        response,
      );
      set({
        endpoints: next.endpoints,
        listeners: next.endpoints.flatMap((entry) => entry.listeners),
      });
      return next.eventBranch;
    },
    setListenerEventResponse: (
      listenerId: string,
      eventType: string,
      response: WebSocketResponseConfig,
    ) => {
      const next = setWebSocketListenerEventResponse(
        state.endpoints,
        listenerId,
        eventType,
        response,
      );
      set({
        endpoints: next.endpoints,
        listeners: next.endpoints.flatMap((entry) => entry.listeners),
      });
      return next.eventBranch;
    },
    replace: (next: WebSocketEndpointConfig[]) => {
      set({ endpoints: next, listeners: next.flatMap((entry) => entry.listeners) });
    },
    hydrate: (saved: WebSocketEndpointConfig[]) => {
      const normalized = webSocketEndpointsSchema.parse(saved);
      const code = state.endpoints.filter((entry) => entry.info.source === "code");
      const savedById = new Map(normalized.map((entry) => [entry.endpointId, entry]));
      const mergedCode = code.map((entry) => savedById.get(entry.endpointId) ?? entry);
      const temp = normalized.filter((entry) => entry.info.source === "temp");
      set({
        endpoints: [...mergedCode, ...temp],
        listeners: [...mergedCode, ...temp].flatMap((entry) => entry.listeners),
      });
    },
    reset: () => {
      runtime?.resetTempEndpoints?.();
      const endpoints = resetWebSocketEndpoints(state.endpoints);
      state = { endpoints, listeners: endpoints.flatMap((entry) => entry.listeners) };
    },
  };
};

export const managedEndpointToInfo = (
  endpoint: ManagedWebSocketEndpoint,
): WebSocketHandlerInfo => ({
  id: endpoint.id,
  kind: "websocket",
  endpoint: endpoint.endpoint,
  operation: "endpoint",
  source: endpoint.source,
});
export const managedListenerToInfo = (
  listener: ManagedWebSocketListener,
  endpoint?: string,
): WebSocketHandlerInfo => ({
  id: listener.id,
  kind: "websocket",
  endpoint: endpoint ?? listener.endpointId,
  operation: listener.event,
  source: listener.source,
});
