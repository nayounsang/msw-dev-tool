import { webSocketEndpointSchema, webSocketResponseConfigSchema } from "../schema/websocket";
import type {
  AddWebSocketListenerInput,
  SerializableWebSocketMatcher,
  WebSocketBehaviorSelection,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
  WebSocketResponseConfig,
  WebSocketEventBranchConfig,
} from "../types";

export const canonicalWebSocketMatcher = (matcher: SerializableWebSocketMatcher): string =>
  matcher.kind === "string"
    ? `string:${matcher.value}`
    : `regexp:${matcher.source}/${matcher.flags}`;

export const createWebSocketEndpointId = (matcher: SerializableWebSocketMatcher) =>
  `websocket:endpoint:${canonicalWebSocketMatcher(matcher)}`;

export const createWebSocketListenerId = (endpointId: string, index: number) =>
  `${endpointId}:message:${index}`;

/** Temporary listeners use a separate namespace so they never collide with
 * listeners discovered from code when a connection is established later. */
export const createTemporaryWebSocketListenerId = (endpointId: string, index: number) =>
  `${endpointId}:temp:message:${index}`;

export const webSocketEndpointFromMatcher = (matcher: SerializableWebSocketMatcher): string =>
  matcher.kind === "string" ? matcher.value : `/${matcher.source}/${matcher.flags}`;

const findEndpoint = (endpoints: WebSocketEndpointConfig[], endpointId: string) => {
  const endpoint = endpoints.find((entry) => entry.endpointId === endpointId);
  if (!endpoint) throw new Error(`WebSocket endpoint not found: ${endpointId}`);
  return endpoint;
};

const findListener = (endpoints: WebSocketEndpointConfig[], listenerId: string) => {
  const endpoint = endpoints.find((entry) =>
    entry.listeners.some((listener) => listener.info.id === listenerId),
  );
  const listener = endpoint?.listeners.find((entry) => entry.info.id === listenerId);
  if (!endpoint || !listener) throw new Error(`WebSocket listener not found: ${listenerId}`);
  return { endpoint, listener };
};

const findEventBranch = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  eventType: string,
) => {
  const { endpoint, listener } = findListener(endpoints, listenerId);
  const eventBranch = listener.eventBranches?.find((entry) => entry.eventType === eventType);
  if (!eventBranch)
    throw new Error(`WebSocket listener event not found: ${listenerId}/${eventType}`);
  return { endpoint, listener, eventBranch };
};

export const reconcileCodeWebSocketListener = (
  existing: WebSocketListenerConfig,
  declaration: WebSocketListenerConfig,
): WebSocketListenerConfig => {
  const eventBranches = declaration.eventBranches?.map(
    (branch) =>
      existing.eventBranches?.find((saved) => saved.eventType === branch.eventType) ?? branch,
  );
  return {
    ...existing,
    enabled: eventBranches ? true : existing.enabled,
    eventBranches,
  };
};

export const mergeDiscoveredWebSocketState = (
  current: WebSocketEndpointConfig[],
  discovered: WebSocketEndpointConfig[],
): WebSocketEndpointConfig[] => {
  if (JSON.stringify(current) === JSON.stringify(discovered)) return current;
  const discoveredCode = discovered.filter((endpoint) => endpoint.info.source === "code");
  return discoveredCode.reduce<WebSocketEndpointConfig[]>((endpoints, declaration) => {
    const existing = endpoints.find((endpoint) => endpoint.endpointId === declaration.endpointId);
    if (!existing) return [...endpoints, declaration];
    const listeners = declaration.listeners
      .filter((listener) => listener.info.source === "code")
      .reduce<WebSocketListenerConfig[]>((entries, listener) => {
        const saved = entries.find((entry) => entry.info.id === listener.info.id);
        if (!saved) return [...entries, listener];
        return entries.map((entry) =>
          entry.info.id === listener.info.id
            ? reconcileCodeWebSocketListener(saved, listener)
            : entry,
        );
      }, existing.listeners);
    return endpoints.map((endpoint) =>
      endpoint.endpointId === declaration.endpointId
        ? { ...endpoint, info: declaration.info, matcher: declaration.matcher, listeners }
        : endpoint,
    );
  }, current);
};

export const addTemporaryWebSocketEndpoint = (
  endpoints: WebSocketEndpointConfig[],
  matcherInput: SerializableWebSocketMatcher,
  endpoint = webSocketEndpointFromMatcher(matcherInput),
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
  endpointId: string,
) => {
  const endpoint = findEndpoint(endpoints, endpointId);
  if (endpoint.info.source !== "temp") {
    throw new Error(
      `WebSocket endpoints generated from codebase cannot be deleted (id: ${endpointId})`,
    );
  }
  return { endpoints: endpoints.filter((entry) => entry.endpointId !== endpointId), endpoint };
};

export const setWebSocketEndpointEnabled = (
  endpoints: WebSocketEndpointConfig[],
  endpointId: string,
  enabled: boolean,
) => {
  findEndpoint(endpoints, endpointId);
  const nextEndpoints = endpoints.map((entry) =>
    entry.endpointId === endpointId ? { ...entry, enabled } : entry,
  );
  return { endpoints: nextEndpoints, endpoint: findEndpoint(nextEndpoints, endpointId) };
};

export const addTemporaryWebSocketListener = (
  endpoints: WebSocketEndpointConfig[],
  endpointId: string,
  input: Omit<AddWebSocketListenerInput, "endpointId">,
) => {
  const endpoint = findEndpoint(endpoints, endpointId);
  const behavior = input.behavior ?? { preset: "default" };
  let index = endpoint.listeners.length;
  let listenerId = createTemporaryWebSocketListenerId(endpointId, index);
  const listeners = endpoints.flatMap((entry) => entry.listeners);
  while (listeners.some((listener) => listener.info.id === listenerId)) {
    index += 1;
    listenerId = createTemporaryWebSocketListenerId(endpointId, index);
  }
  const listener: WebSocketListenerConfig = {
    info: {
      id: listenerId,
      kind: "websocket",
      endpoint: endpoint.info.endpoint,
      operation: "message",
      source: "temp",
    },
    endpointId,
    event: "message",
    enabled: true,
    behavior,
    response:
      input.response === undefined
        ? undefined
        : webSocketResponseConfigSchema.parse(input.response),
    customResponse:
      input.customResponse === undefined
        ? undefined
        : webSocketResponseConfigSchema.parse(input.customResponse),
  };
  const nextEndpoints = endpoints.map((entry) =>
    entry.endpointId === endpointId
      ? { ...entry, listeners: [...entry.listeners, listener] }
      : entry,
  );
  return { endpoints: nextEndpoints, endpoint: findEndpoint(nextEndpoints, endpointId), listener };
};

export const removeTemporaryWebSocketListener = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
) => {
  const { listener } = findListener(endpoints, listenerId);
  if (listener.info.source !== "temp") {
    throw new Error(
      `WebSocket listeners generated from codebase cannot be deleted (id: ${listenerId})`,
    );
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
  enabled: boolean,
) => {
  findListener(endpoints, listenerId);
  const nextEndpoints = endpoints.map((endpoint) => ({
    ...endpoint,
    listeners: endpoint.listeners.map((entry) =>
      entry.info.id === listenerId ? { ...entry, enabled } : entry,
    ),
  }));
  const { endpoint, listener } = findListener(nextEndpoints, listenerId);
  return { endpoints: nextEndpoints, endpoint, listener };
};

export const setWebSocketListenerBehavior = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  behaviorInput: WebSocketBehaviorSelection,
) => {
  findListener(endpoints, listenerId);
  const behavior = behaviorInput;
  const nextEndpoints = endpoints.map((endpoint) => ({
    ...endpoint,
    listeners: endpoint.listeners.map((entry) =>
      entry.info.id === listenerId ? { ...entry, behavior } : entry,
    ),
  }));
  const { endpoint, listener } = findListener(nextEndpoints, listenerId);
  return { endpoints: nextEndpoints, endpoint, listener };
};

export const setWebSocketListenerCustomResponse = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  customResponse: WebSocketResponseConfig,
) => {
  const response = webSocketResponseConfigSchema.parse(customResponse);
  const nextEndpoints = endpoints.map((endpoint) => ({
    ...endpoint,
    listeners: endpoint.listeners.map((entry) =>
      entry.info.id === listenerId ? { ...entry, customResponse: response } : entry,
    ),
  }));
  const { endpoint, listener } = findListener(nextEndpoints, listenerId);
  return { endpoints: nextEndpoints, endpoint, listener };
};

export const setWebSocketListenerResponse = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  response: WebSocketResponseConfig,
) => {
  const parsed = webSocketResponseConfigSchema.parse(response);
  const nextEndpoints = endpoints.map((endpoint) => ({
    ...endpoint,
    listeners: endpoint.listeners.map((entry) =>
      entry.info.id === listenerId ? { ...entry, response: parsed } : entry,
    ),
  }));
  const { endpoint, listener } = findListener(nextEndpoints, listenerId);
  return { endpoints: nextEndpoints, endpoint, listener };
};

const updateEventBranch = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  eventType: string,
  update: (branch: WebSocketEventBranchConfig) => WebSocketEventBranchConfig,
) => {
  findEventBranch(endpoints, listenerId, eventType);
  const nextEndpoints = endpoints.map((endpoint) => ({
    ...endpoint,
    listeners: endpoint.listeners.map((listener) =>
      listener.info.id !== listenerId
        ? listener
        : {
            ...listener,
            eventBranches: listener.eventBranches?.map((branch) =>
              branch.eventType === eventType ? update(branch) : branch,
            ),
          },
    ),
  }));
  return { endpoints: nextEndpoints, ...findEventBranch(nextEndpoints, listenerId, eventType) };
};

export const setWebSocketListenerEventBehavior = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  eventType: string,
  behavior: WebSocketBehaviorSelection,
) => updateEventBranch(endpoints, listenerId, eventType, (branch) => ({ ...branch, behavior }));

export const setWebSocketListenerEventEnabled = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  eventType: string,
  enabled: boolean,
) => updateEventBranch(endpoints, listenerId, eventType, (branch) => ({ ...branch, enabled }));

export const setWebSocketListenerEventCustomResponse = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  eventType: string,
  customResponse: WebSocketResponseConfig,
) => {
  const parsed = webSocketResponseConfigSchema.parse(customResponse);
  return updateEventBranch(endpoints, listenerId, eventType, (branch) => ({
    ...branch,
    customResponse: parsed,
  }));
};

export const setWebSocketListenerEventResponse = (
  endpoints: WebSocketEndpointConfig[],
  listenerId: string,
  eventType: string,
  response: WebSocketResponseConfig,
) => {
  const parsed = webSocketResponseConfigSchema.parse(response);
  return updateEventBranch(endpoints, listenerId, eventType, (branch) => ({
    ...branch,
    response: parsed,
  }));
};

export const resetWebSocketEndpoints = (endpoints: WebSocketEndpointConfig[]) =>
  endpoints
    .filter((entry) => entry.info.source === "code")
    .map((entry) => ({
      ...entry,
      enabled: true,
      listeners: entry.listeners
        .filter((listener) => listener.info.source === "code")
        .map((listener) => ({
          ...listener,
          enabled: true,
          eventBranches: listener.eventBranches?.map((branch) => ({ ...branch, enabled: true })),
        })),
    }));

export type WebSocketStateMutation = {
  endpoints: WebSocketEndpointConfig[];
  endpoint?: WebSocketEndpointConfig;
  listener?: WebSocketListenerConfig;
};
