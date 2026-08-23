import type {
  ManagedWebSocketEndpoint,
  ManagedWebSocketListener,
  SerializableWebSocketMatcher,
  WebSocketBehaviorSelection,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
  WebSocketHandlerInfo,
  WebSocketResponse,
  WebSocketRepeat,
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
  setWebSocketListenerSchedule,
  setWebSocketListenerEnabled,
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
export { canonicalWebSocketMatcher, createWebSocketEndpointId, createWebSocketListenerId } from "../websocket/state";

export const createWebSocketSlice = (runtime?: WebSocketRuntimeAdapter) => {
  let state: WebSocketStoreState = { endpoints: [], listeners: [] };
  const getEndpoint = (id: string) => state.endpoints.find((entry) => entry.endpointId === id);
  const getListener = (id: string) => state.listeners.find((entry) => entry.info.id === id);
  const set = (next: WebSocketStoreState) => { state = next; };
  const registerListener = (listener: WebSocketListenerConfig) => {
    if (getListener(listener.info.id)) return;
    const endpoint = getEndpoint(listener.endpointId);
    if (!endpoint) return;
    set({
      endpoints: state.endpoints.map((entry) => entry.endpointId === endpoint.endpointId
        ? { ...entry, listeners: [...entry.listeners, listener] }
        : entry),
      listeners: [...state.listeners, listener],
    });
  };

  return {
    getState: () => state,
    registerCodeEndpoint: (input: { info: WebSocketHandlerInfo; matcher: SerializableWebSocketMatcher }) => {
      if (state.endpoints.some((entry) => entry.endpointId === input.info.id)) return;
      set({ ...state, endpoints: [...state.endpoints, {
        info: input.info, endpointId: input.info.id, matcher: input.matcher,
        enabled: true, listeners: [],
      }] });
    },
    registerCodeListener: (input: { info: WebSocketHandlerInfo; endpointId: string; event: "message" }) => {
      registerListener({ ...input, enabled: true, behavior: defaultBehavior, delay: 0 });
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
      set({ endpoints: next.endpoints, listeners: state.listeners.filter((entry) => !listenerIds.has(entry.info.id)) });
    },
    removeListener: (listenerId: string) => {
      const next = removeTemporaryWebSocketListener(state.endpoints, listenerId);
      set({ endpoints: next.endpoints, listeners: state.listeners.filter((entry) => entry.info.id !== listenerId) });
    },
    setEndpointEnabled: (endpointId: string, enabled: boolean) => {
      const next = setWebSocketEndpointEnabled(state.endpoints, endpointId, enabled);
      if (!enabled) runtime?.closeEndpointConnections?.(endpointId);
      set({ ...state, endpoints: next.endpoints });
    },
    setListenerEnabled: (listenerId: string, enabled: boolean) => {
      const next = setWebSocketListenerEnabled(state.endpoints, listenerId, enabled);
      set({ endpoints: next.endpoints, listeners: state.listeners.map((entry) => entry.info.id === listenerId ? next.listener : entry) });
    },
    setListenerBehavior: (listenerId: string, behavior: WebSocketBehaviorSelection) => {
      const next = setWebSocketListenerBehavior(state.endpoints, listenerId, behavior);
      set({ endpoints: next.endpoints, listeners: state.listeners.map((entry) => entry.info.id === listenerId ? next.listener : entry) });
    },
    setListenerCustomResponse: (listenerId: string, customResponse: WebSocketResponse) => {
      const next = setWebSocketListenerCustomResponse(state.endpoints, listenerId, customResponse);
      set({ endpoints: next.endpoints, listeners: state.listeners.map((entry) => entry.info.id === listenerId ? next.listener : entry) });
    },
    setListenerResponse: (listenerId: string, response: WebSocketResponse) => {
      const next = setWebSocketListenerResponse(state.endpoints, listenerId, response);
      set({ endpoints: next.endpoints, listeners: state.listeners.map((entry) => entry.info.id === listenerId ? next.listener : entry) });
    },
    setListenerSchedule: (listenerId: string, input: { delay?: number; repeat?: WebSocketRepeat }) => {
      const next = setWebSocketListenerSchedule(state.endpoints, listenerId, input);
      set({ endpoints: next.endpoints, listeners: state.listeners.map((entry) => entry.info.id === listenerId ? next.listener : entry) });
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
      set({ endpoints: [...mergedCode, ...temp], listeners: [...mergedCode, ...temp].flatMap((entry) => entry.listeners) });
    },
    reset: () => {
      runtime?.resetTempEndpoints?.();
      const endpoints = resetWebSocketEndpoints(state.endpoints);
      state = { endpoints, listeners: endpoints.flatMap((entry) => entry.listeners) };
    },
  };
};

export const managedEndpointToInfo = (endpoint: ManagedWebSocketEndpoint): WebSocketHandlerInfo => ({ id: endpoint.id, kind: "websocket", endpoint: endpoint.endpoint, operation: "endpoint", source: endpoint.source });
export const managedListenerToInfo = (listener: ManagedWebSocketListener, endpoint?: string): WebSocketHandlerInfo => ({ id: listener.id, kind: "websocket", endpoint: endpoint ?? listener.endpointId, operation: listener.event, source: listener.source });
