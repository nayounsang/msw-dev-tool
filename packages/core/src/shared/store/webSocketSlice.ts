import type {
  DevToolHandlerInfo,
  ManagedWebSocketEndpoint,
  ManagedWebSocketListener,
  SerializableWebSocketMatcher,
  WebSocketBehaviorSelection,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
  WebSocketHandlerInfo,
} from "../types";

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

export const canonicalWebSocketMatcher = (
  matcher: SerializableWebSocketMatcher
): string => matcher.kind === "string"
  ? `string:${matcher.value}`
  : `regexp:${matcher.source}/${matcher.flags}`;

const defaultBehavior: WebSocketBehaviorSelection = { preset: "default" };

export const createWebSocketEndpointId = (matcher: SerializableWebSocketMatcher) =>
  `websocket:endpoint:${canonicalWebSocketMatcher(matcher)}`;

export const createWebSocketListenerId = (endpointId: string, index: number) =>
  `${endpointId}:message:${index}`;

export const createWebSocketSlice = (runtime?: WebSocketRuntimeAdapter) => {
  let state: WebSocketStoreState = { endpoints: [], listeners: [] };
  let endpointOrder = 0;

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
      registerListener({ ...input, enabled: true, behavior: defaultBehavior });
    },
    addTempEndpoint: (input: { matcher: SerializableWebSocketMatcher; endpoint: string }) => {
      const endpointId = `${createWebSocketEndpointId(input.matcher)}:${endpointOrder++}`;
      const info: WebSocketHandlerInfo = { id: endpointId, kind: "websocket", endpoint: input.endpoint, operation: "endpoint", source: "temp" };
      const config: WebSocketEndpointConfig = { info, endpointId, matcher: input.matcher, enabled: true, listeners: [] };
      set({ ...state, endpoints: [...state.endpoints, config] });
      runtime?.addTempEndpoint?.(config);
      return endpointId;
    },
    addTempListener: (input: { endpointId: string; behavior: WebSocketBehaviorSelection }) => {
      const endpoint = getEndpoint(input.endpointId);
      if (!endpoint) throw new Error(`WebSocket endpoint not found: ${input.endpointId}`);
      const index = endpoint.listeners.length;
      const id = createWebSocketListenerId(input.endpointId, index);
      const listener: WebSocketListenerConfig = {
        info: { id, kind: "websocket", endpoint: endpoint.info.endpoint, operation: "message", source: "temp" },
        endpointId: input.endpointId, event: "message", enabled: true, behavior: input.behavior,
      };
      registerListener(listener);
      return id;
    },
    removeEndpoint: (endpointId: string) => {
      const endpoint = getEndpoint(endpointId);
      if (!endpoint) throw new Error(`WebSocket endpoint not found: ${endpointId}`);
      if (endpoint.info.source !== "temp") throw new Error(`WebSocket endpoints generated from codebase cannot be deleted (id: ${endpointId})`);
      runtime?.closeEndpointConnections?.(endpointId);
      runtime?.removeEndpoint?.(endpointId);
      const listenerIds = new Set(endpoint.listeners.map((entry) => entry.info.id));
      set({ endpoints: state.endpoints.filter((entry) => entry.endpointId !== endpointId), listeners: state.listeners.filter((entry) => !listenerIds.has(entry.info.id)) });
    },
    removeListener: (listenerId: string) => {
      const listener = getListener(listenerId);
      if (!listener) throw new Error(`WebSocket listener not found: ${listenerId}`);
      if (listener.info.source !== "temp") throw new Error(`WebSocket listeners generated from codebase cannot be deleted (id: ${listenerId})`);
      set({ endpoints: state.endpoints.map((entry) => ({ ...entry, listeners: entry.listeners.filter((item) => item.info.id !== listenerId) })), listeners: state.listeners.filter((entry) => entry.info.id !== listenerId) });
    },
    setEndpointEnabled: (endpointId: string, enabled: boolean) => {
      if (!getEndpoint(endpointId)) throw new Error(`WebSocket endpoint not found: ${endpointId}`);
      if (!enabled) runtime?.closeEndpointConnections?.(endpointId);
      set({ ...state, endpoints: state.endpoints.map((entry) => entry.endpointId === endpointId ? { ...entry, enabled } : entry) });
    },
    setListenerEnabled: (listenerId: string, enabled: boolean) => {
      if (!getListener(listenerId)) throw new Error(`WebSocket listener not found: ${listenerId}`);
      set({ endpoints: state.endpoints.map((endpoint) => ({ ...endpoint, listeners: endpoint.listeners.map((entry) => entry.info.id === listenerId ? { ...entry, enabled } : entry) })), listeners: state.listeners.map((entry) => entry.info.id === listenerId ? { ...entry, enabled } : entry) });
    },
    setListenerBehavior: (listenerId: string, behavior: WebSocketBehaviorSelection) => {
      if (!getListener(listenerId)) throw new Error(`WebSocket listener not found: ${listenerId}`);
      set({ endpoints: state.endpoints.map((endpoint) => ({ ...endpoint, listeners: endpoint.listeners.map((entry) => entry.info.id === listenerId ? { ...entry, behavior } : entry) })), listeners: state.listeners.map((entry) => entry.info.id === listenerId ? { ...entry, behavior } : entry) });
    },
    replace: (next: WebSocketEndpointConfig[]) => {
      set({ endpoints: next, listeners: next.flatMap((entry) => entry.listeners) });
    },
    hydrate: (saved: WebSocketEndpointConfig[]) => {
      const code = state.endpoints.filter((entry) => entry.info.source === "code");
      const savedById = new Map(saved.map((entry) => [entry.endpointId, entry]));
      const mergedCode = code.map((entry) => savedById.get(entry.endpointId) ?? entry);
      const temp = saved.filter((entry) => entry.info.source === "temp");
      set({ endpoints: [...mergedCode, ...temp], listeners: [...mergedCode, ...temp].flatMap((entry) => entry.listeners) });
    },
    reset: () => {
      runtime?.resetTempEndpoints?.();
      state = { endpoints: state.endpoints.filter((entry) => entry.info.source === "code").map((entry) => ({ ...entry, listeners: entry.listeners.filter((listener) => listener.info.source === "code") })), listeners: state.listeners.filter((entry) => entry.info.source === "code") };
    },
  };
};

export const managedEndpointToInfo = (endpoint: ManagedWebSocketEndpoint): WebSocketHandlerInfo => ({ id: endpoint.id, kind: "websocket", endpoint: endpoint.endpoint, operation: "endpoint", source: endpoint.source });
export const managedListenerToInfo = (listener: ManagedWebSocketListener): WebSocketHandlerInfo => ({ id: listener.id, kind: "websocket", endpoint: listener.endpointId, operation: listener.event, source: listener.source });
