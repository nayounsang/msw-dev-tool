import { getRowId } from "../../shared/utils/store";
import {
  CustomResponse,
  HttpHandlerBehavior,
  SerializableWebSocketMatcher,
  TempHandlerInput,
  WebSocketBehaviorSelection,
  WebSocketEndpointConfig,
} from "../../shared/types";
import {
  webSocketEndpointSchema,
  webSocketBehaviorSchema,
  webSocketListenerSchema,
} from "../../shared/schema/websocket";
import {
  createWebSocketEndpointId,
  createWebSocketListenerId,
} from "../../shared/store/webSocketSlice";
import { bumpSnapshot } from "./serialize";
import { readSnapshotOrEmpty, withLockedMutation } from "./file";
import { SessionSnapshot, SerializableFlattenHandler } from "./types";

export const listSnapshotHandlers = async (sessionPath: string): Promise<SerializableFlattenHandler[]> =>
  (await readSnapshotOrEmpty(sessionPath)).state.flattenHandlers;

export const getSnapshotHandler = async (
  sessionPath: string,
  id: string
): Promise<SerializableFlattenHandler | undefined> =>
  (await listSnapshotHandlers(sessionPath)).find((handler) => handler.id === id);

type SnapshotWebSocketEndpoint = NonNullable<SessionSnapshot["state"]["webSocket"]>[number];

const snapshotWebSocketEndpoints = (snapshot: SessionSnapshot): SnapshotWebSocketEndpoint[] =>
  snapshot.state.webSocket ?? [];

const endpointFromMatcher = (matcher: SerializableWebSocketMatcher): string =>
  matcher.kind === "string" ? matcher.value : `/${matcher.source}/${matcher.flags}`;

export const listSnapshotWebSocketEndpoints = async (
  sessionPath: string
): Promise<WebSocketEndpointConfig[]> => snapshotWebSocketEndpoints(await readSnapshotOrEmpty(sessionPath));

export const getSnapshotWebSocketEndpoint = async (
  sessionPath: string,
  endpointId: string
): Promise<WebSocketEndpointConfig | undefined> =>
  (await listSnapshotWebSocketEndpoints(sessionPath)).find((endpoint) => endpoint.endpointId === endpointId);

export const addSnapshotWebSocketEndpoint = (
  sessionPath: string,
  matcher: SerializableWebSocketMatcher
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const endpoints = snapshotWebSocketEndpoints(prev);
  let index = 0;
  let endpointId = `${createWebSocketEndpointId(matcher)}:${index}`;
  while (endpoints.some((endpoint) => endpoint.endpointId === endpointId)) {
    index += 1;
    endpointId = `${createWebSocketEndpointId(matcher)}:${index}`;
  }
  const endpoint = webSocketEndpointSchema.parse({
    info: {
      id: endpointId,
      kind: "websocket",
      endpoint: endpointFromMatcher(matcher),
      operation: "endpoint",
      source: "temp",
    },
    endpointId,
    matcher,
    enabled: true,
    listeners: [],
  });
  return bumpSnapshot(prev, { webSocket: [...endpoints, endpoint] });
});

export const removeSnapshotWebSocketEndpoint = (
  sessionPath: string,
  endpointId: string
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const endpoints = snapshotWebSocketEndpoints(prev);
  const endpoint = endpoints.find((entry) => entry.endpointId === endpointId);
  if (!endpoint) throw new Error(`WebSocket endpoint not found: ${endpointId}`);
  if (endpoint.info.source !== "temp") {
    throw new Error(`WebSocket endpoints generated from codebase cannot be deleted (id: ${endpointId})`);
  }
  return bumpSnapshot(prev, { webSocket: endpoints.filter((entry) => entry.endpointId !== endpointId) });
});

export const setSnapshotWebSocketEndpointEnabled = (
  sessionPath: string,
  endpointId: string,
  enabled: boolean
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const endpoints = snapshotWebSocketEndpoints(prev);
  if (!endpoints.some((endpoint) => endpoint.endpointId === endpointId)) {
    throw new Error(`WebSocket endpoint not found: ${endpointId}`);
  }
  return bumpSnapshot(prev, {
    webSocket: endpoints.map((endpoint) => endpoint.endpointId === endpointId ? { ...endpoint, enabled } : endpoint),
  });
});

export const addSnapshotWebSocketListener = (
  sessionPath: string,
  endpointId: string,
  behavior: WebSocketBehaviorSelection
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const endpoints = snapshotWebSocketEndpoints(prev);
  const endpoint = endpoints.find((entry) => entry.endpointId === endpointId);
  if (!endpoint) throw new Error(`WebSocket endpoint not found: ${endpointId}`);
  let index = endpoint.listeners.length;
  let listenerId = createWebSocketListenerId(endpointId, index);
  const listeners = endpoints.flatMap((entry) => entry.listeners);
  while (listeners.some((listener) => listener.info.id === listenerId)) {
    index += 1;
    listenerId = createWebSocketListenerId(endpointId, index);
  }
  const listener = webSocketListenerSchema.parse({
    info: {
      id: listenerId,
      kind: "websocket" as const,
      endpoint: endpoint.info.endpoint,
      operation: "message",
      source: "temp" as const,
    },
    endpointId,
    event: "message" as const,
    enabled: true,
    behavior,
  });
  return bumpSnapshot(prev, {
    webSocket: endpoints.map((entry) => entry.endpointId === endpointId
      ? { ...entry, listeners: [...entry.listeners, listener] }
      : entry),
  });
});

export const removeSnapshotWebSocketListener = (
  sessionPath: string,
  listenerId: string
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const endpoints = snapshotWebSocketEndpoints(prev);
  const listener = endpoints.flatMap((endpoint) => endpoint.listeners).find((entry) => entry.info.id === listenerId);
  if (!listener) throw new Error(`WebSocket listener not found: ${listenerId}`);
  if (listener.info.source !== "temp") {
    throw new Error(`WebSocket listeners generated from codebase cannot be deleted (id: ${listenerId})`);
  }
  return bumpSnapshot(prev, {
    webSocket: endpoints.map((endpoint) => ({
      ...endpoint,
      listeners: endpoint.listeners.filter((entry) => entry.info.id !== listenerId),
    })),
  });
});

export const setSnapshotWebSocketListenerEnabled = (
  sessionPath: string,
  listenerId: string,
  enabled: boolean
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const endpoints = snapshotWebSocketEndpoints(prev);
  if (!endpoints.some((endpoint) => endpoint.listeners.some((listener) => listener.info.id === listenerId))) {
    throw new Error(`WebSocket listener not found: ${listenerId}`);
  }
  return bumpSnapshot(prev, {
    webSocket: endpoints.map((endpoint) => ({
      ...endpoint,
      listeners: endpoint.listeners.map((listener) => listener.info.id === listenerId ? { ...listener, enabled } : listener),
    })),
  });
});

export const setSnapshotWebSocketListenerBehavior = (
  sessionPath: string,
  listenerId: string,
  behavior: WebSocketBehaviorSelection
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const endpoints = snapshotWebSocketEndpoints(prev);
  if (!endpoints.some((endpoint) => endpoint.listeners.some((listener) => listener.info.id === listenerId))) {
    throw new Error(`WebSocket listener not found: ${listenerId}`);
  }
  const nextBehavior = webSocketBehaviorSchema.parse(behavior);
  return bumpSnapshot(prev, {
    webSocket: endpoints.map((endpoint) => ({
      ...endpoint,
      listeners: endpoint.listeners.map((listener) => listener.info.id === listenerId ? { ...listener, behavior: nextBehavior } : listener),
    })),
  });
});

export const setSnapshotBehavior = (
  sessionPath: string, id: string, behavior: HttpHandlerBehavior
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  if (!prev.state.flattenHandlers.some((handler) => handler.id === id)) throw new Error(`Handler not found for id: ${id}`);
  return bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers.map((handler) => handler.id === id ? { ...handler, behavior } : handler) });
});

export const setSnapshotCustomResponse = (
  sessionPath: string, id: string, customResponse: CustomResponse
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  if (!prev.state.flattenHandlers.some((handler) => handler.id === id)) throw new Error(`Handler not found for id: ${id}`);
  return bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers.map((handler) => handler.id === id ? { ...handler, customResponse } : handler) });
});

export const addSnapshotTempHandler = (
  sessionPath: string, data: TempHandlerInput
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const id = getRowId({ path: data.path, method: data.method });
  if (prev.state.flattenHandlers.some((handler) => handler.id === id)) throw new Error(`Duplicate handler id: ${id}. Change method or path.`);
  const entry: SerializableFlattenHandler = { id, path: data.path, method: data.method, behavior: HttpHandlerBehavior.DEFAULT, type: "temp", tempInput: data };
  return bumpSnapshot(prev, { flattenHandlers: [...prev.state.flattenHandlers, entry] });
});

export const removeSnapshotTempHandler = (
  sessionPath: string, id: string
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const target = prev.state.flattenHandlers.find((handler) => handler.id === id);
  if (!target) throw new Error(`Handler not found for the given id: ${id}`);
  if (target.type !== "temp") throw new Error(`Handlers generated from codebase cannot be deleted (id: ${id}). You can only disable them.`);
  return bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers.filter((handler) => handler.id !== id) });
});

export const requestSnapshotReset = (sessionPath: string): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers, pendingReset: true }));
