import {
  webSocketEndpointSchema,
} from "../schema/websocket";
import type {
  SerializableWebSocketMatcher,
  WebSocketBehaviorSelection,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
} from "../types";

export const canonicalWebSocketMatcher = (matcher: SerializableWebSocketMatcher): string =>
  matcher.kind === "string"
    ? `string:${matcher.value}`
    : `regexp:${matcher.source}/${matcher.flags}`;

export const createWebSocketEndpointId = (matcher: SerializableWebSocketMatcher) =>
  `websocket:endpoint:${canonicalWebSocketMatcher(matcher)}`;

export const createWebSocketListenerId = (endpointId: string, index: number) =>
  `${endpointId}:message:${index}`;

export const webSocketEndpointFromMatcher = (matcher: SerializableWebSocketMatcher): string =>
  matcher.kind === "string" ? matcher.value : `/${matcher.source}/${matcher.flags}`;

const findEndpoint = (endpoints: WebSocketEndpointConfig[], endpointId: string) => {
  const endpoint = endpoints.find((entry) => entry.endpointId === endpointId);
  if (!endpoint) throw new Error(`WebSocket endpoint not found: ${endpointId}`);
  return endpoint;
};

const findListener = (endpoints: WebSocketEndpointConfig[], listenerId: string) => {
  const endpoint = endpoints.find((entry) =>
    entry.listeners.some((listener) => listener.info.id === listenerId)
  );
  const listener = endpoint?.listeners.find((entry) => entry.info.id === listenerId);
  if (!endpoint || !listener) throw new Error(`WebSocket listener not found: ${listenerId}`);
  return { endpoint, listener };
};

export const addTemporaryWebSocketEndpoint = (
  endpoints: WebSocketEndpointConfig[],
  matcherInput: SerializableWebSocketMatcher,
  endpoint = webSocketEndpointFromMatcher(matcherInput)
) => {
  const matcher = matcherInput;
  let index = 0;
  let endpointId = `${createWebSocketEndpointId(matcher)}:${index}`;
  while (endpoints.some((entry) => entry.endpointId === endpointId)) {
    index += 1;
    endpointId = `${createWebSocketEndpointId(matcher)}:${index}`;
  }
  const created = webSocketEndpointSchema.parse({
    info: { id: endpointId, kind: "websocket", endpoint, operation: "endpoint", source: "temp" },
    endpointId,
    matcher,
    enabled: true,
    listeners: [],
  });
  return { endpoints: [...endpoints, created], endpoint: created };
};

export const removeTemporaryWebSocketEndpoint = (
  endpoints: WebSocketEndpointConfig[],
  endpointId: string
) => {
  const endpoint = findEndpoint(endpoints, endpointId);
  if (endpoint.info.source !== "temp") {
    throw new Error(`WebSocket endpoints generated from codebase cannot be deleted (id: ${endpointId})`);
  }
  return { endpoints: endpoints.filter((entry) => entry.endpointId !== endpointId), endpoint };
};

export const setWebSocketEndpointEnabled = (
  endpoints: WebSocketEndpointConfig[],
  endpointId: string,
  enabled: boolean
) => {
  findEndpoint(endpoints, endpointId);
  const nextEndpoints = endpoints.map((entry) =>
    entry.endpointId === endpointId ? { ...entry, enabled } : entry
  );
  return { endpoints: nextEndpoints, endpoint: findEndpoint(nextEndpoints, endpointId) };
};

export const addTemporaryWebSocketListener = (
  endpoints: WebSocketEndpointConfig[],
  endpointId: string,
  behaviorInput: WebSocketBehaviorSelection
) => {
  const endpoint = findEndpoint(endpoints, endpointId);
  const behavior = behaviorInput;
  let index = endpoint.listeners.length;
  let listenerId = createWebSocketListenerId(endpointId, index);
  const listeners = endpoints.flatMap((entry) => entry.listeners);
  while (listeners.some((listener) => listener.info.id === listenerId)) {
    index += 1;
    listenerId = createWebSocketListenerId(endpointId, index);
  }
  const listener: WebSocketListenerConfig = {
    info: { id: listenerId, kind: "websocket", endpoint: endpoint.info.endpoint, operation: "message", source: "temp" },
    endpointId,
    event: "message",
    enabled: true,
    behavior,
  };
  const nextEndpoints = endpoints.map((entry) =>
    entry.endpointId === endpointId ? { ...entry, listeners: [...entry.listeners, listener] } : entry
  );
  return { endpoints: nextEndpoints, endpoint: findEndpoint(nextEndpoints, endpointId), listener };
};

export const removeTemporaryWebSocketListener = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string
) => {
  const { listener } = findListener(endpoints, listenerId);
  if (listener.info.source !== "temp") {
    throw new Error(`WebSocket listeners generated from codebase cannot be deleted (id: ${listenerId})`);
  }
  return {
    endpoints: endpoints.map((endpoint) => ({
      ...endpoint,
      listeners: endpoint.listeners.filter((entry) => entry.info.id !== listenerId),
    })),
    listener,
  };
};

export const setWebSocketListenerEnabled = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  enabled: boolean
) => {
  findListener(endpoints, listenerId);
  const nextEndpoints = endpoints.map((endpoint) => ({
    ...endpoint,
    listeners: endpoint.listeners.map((entry) =>
      entry.info.id === listenerId ? { ...entry, enabled } : entry
    ),
  }));
  const { endpoint, listener } = findListener(nextEndpoints, listenerId);
  return { endpoints: nextEndpoints, endpoint, listener };
};

export const setWebSocketListenerBehavior = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  behaviorInput: WebSocketBehaviorSelection
) => {
  findListener(endpoints, listenerId);
  const behavior = behaviorInput;
  const nextEndpoints = endpoints.map((endpoint) => ({
    ...endpoint,
    listeners: endpoint.listeners.map((entry) =>
      entry.info.id === listenerId ? { ...entry, behavior } : entry
    ),
  }));
  const { endpoint, listener } = findListener(nextEndpoints, listenerId);
  return { endpoints: nextEndpoints, endpoint, listener };
};

export const resetWebSocketEndpoints = (endpoints: WebSocketEndpointConfig[]) =>
  endpoints
    .filter((entry) => entry.info.source === "code")
    .map((entry) => ({
      ...entry,
      listeners: entry.listeners.filter((listener) => listener.info.source === "code"),
    }));

export type WebSocketStateMutation = {
  endpoints: WebSocketEndpointConfig[];
  endpoint?: WebSocketEndpointConfig;
  listener?: WebSocketListenerConfig;
};
