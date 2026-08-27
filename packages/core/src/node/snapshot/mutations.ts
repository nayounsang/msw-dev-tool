import { getRowId } from "../../shared/utils/store";
import {
  HttpResponseConfig,
  HttpHandlerBehavior,
  TempHandlerInput,
  AddWebSocketListenerInput,
  WebSocketResponseConfig,
  WebSocketEndpointConfig,
} from "../../shared/types";
import {
  addTemporaryWebSocketEndpoint,
  addTemporaryWebSocketListener,
  removeTemporaryWebSocketEndpoint,
  removeTemporaryWebSocketListener,
  setWebSocketEndpointEnabled,
  setWebSocketListenerBehavior,
  setWebSocketListenerCustomResponse,
  setWebSocketListenerResponse,
  setWebSocketListenerEnabled,
  setWebSocketListenerEventEnabled,
  setWebSocketListenerEventBehavior,
  setWebSocketListenerEventCustomResponse,
  setWebSocketListenerEventResponse,
} from "../../shared/websocket/state";
import {
  serializableWebSocketMatcherSchema,
  webSocketBehaviorSchema,
  webSocketEndpointsSchema,
  webSocketResponseConfigSchema,
} from "../../shared/schema/websocket";
import { bumpSnapshot } from "./serialize";
import { readSnapshotOrEmpty, withLockedMutation } from "./file";
import { SessionSnapshot, SerializableFlattenHandler } from "./types";

export const listSnapshotHandlers = async (
  sessionPath: string,
): Promise<SerializableFlattenHandler[]> =>
  (await readSnapshotOrEmpty(sessionPath)).state.flattenHandlers;

export const getSnapshotHandler = async (
  sessionPath: string,
  id: string,
): Promise<SerializableFlattenHandler | undefined> =>
  (await listSnapshotHandlers(sessionPath)).find((handler) => handler.id === id);

type SnapshotWebSocketEndpoint = NonNullable<SessionSnapshot["state"]["webSocket"]>[number];

const snapshotWebSocketEndpoints = (snapshot: SessionSnapshot): SnapshotWebSocketEndpoint[] =>
  snapshot.state.webSocket ?? [];

export const listSnapshotWebSocketEndpoints = async (
  sessionPath: string,
): Promise<WebSocketEndpointConfig[]> =>
  snapshotWebSocketEndpoints(await readSnapshotOrEmpty(sessionPath));

export const getSnapshotWebSocketEndpoint = async (
  sessionPath: string,
  endpointId: string,
): Promise<WebSocketEndpointConfig | undefined> =>
  (await listSnapshotWebSocketEndpoints(sessionPath)).find(
    (endpoint) => endpoint.endpointId === endpointId,
  );

export const addSnapshotWebSocketEndpoint = (
  sessionPath: string,
  matcher: WebSocketEndpointConfig["matcher"],
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = addTemporaryWebSocketEndpoint(
      snapshotWebSocketEndpoints(prev),
      serializableWebSocketMatcherSchema.parse(matcher),
    );
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const removeSnapshotWebSocketEndpoint = (
  sessionPath: string,
  endpointId: string,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = removeTemporaryWebSocketEndpoint(snapshotWebSocketEndpoints(prev), endpointId);
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const setSnapshotWebSocketEndpointEnabled = (
  sessionPath: string,
  endpointId: string,
  enabled: boolean,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = setWebSocketEndpointEnabled(snapshotWebSocketEndpoints(prev), endpointId, enabled);
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const addSnapshotWebSocketListener = (
  sessionPath: string,
  endpointIdOrInput: string | AddWebSocketListenerInput,
  behaviorOrInput?:
    | WebSocketEndpointConfig["listeners"][number]["behavior"]
    | Omit<AddWebSocketListenerInput, "endpointId">,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const endpointId =
      typeof endpointIdOrInput === "string" ? endpointIdOrInput : endpointIdOrInput.endpointId;
    const suppliedInput =
      (typeof endpointIdOrInput === "string" ? behaviorOrInput : endpointIdOrInput) ?? {};
    if (!snapshotWebSocketEndpoints(prev).some((endpoint) => endpoint.endpointId === endpointId)) {
      throw new Error(`WebSocket endpoint not found: ${endpointId}`);
    }
    const input =
      "preset" in suppliedInput
        ? { behavior: webSocketBehaviorSchema.parse(suppliedInput) }
        : {
            ...suppliedInput,
            behavior: suppliedInput.behavior
              ? webSocketBehaviorSchema.parse(suppliedInput.behavior)
              : undefined,
            response:
              suppliedInput.response === undefined
                ? undefined
                : webSocketResponseConfigSchema.parse(suppliedInput.response),
            customResponse:
              suppliedInput.customResponse === undefined
                ? undefined
                : webSocketResponseConfigSchema.parse(suppliedInput.customResponse),
          };
    const next = addTemporaryWebSocketListener(snapshotWebSocketEndpoints(prev), endpointId, input);
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const removeSnapshotWebSocketListener = (
  sessionPath: string,
  listenerId: string,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = removeTemporaryWebSocketListener(snapshotWebSocketEndpoints(prev), listenerId);
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const setSnapshotWebSocketListenerEnabled = (
  sessionPath: string,
  listenerId: string,
  enabled: boolean,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = setWebSocketListenerEnabled(snapshotWebSocketEndpoints(prev), listenerId, enabled);
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const setSnapshotWebSocketListenerBehavior = (
  sessionPath: string,
  listenerId: string,
  behavior: WebSocketEndpointConfig["listeners"][number]["behavior"],
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    if (
      !snapshotWebSocketEndpoints(prev).some((endpoint) =>
        endpoint.listeners.some((listener) => listener.info.id === listenerId),
      )
    ) {
      throw new Error(`WebSocket listener not found: ${listenerId}`);
    }
    const next = setWebSocketListenerBehavior(
      snapshotWebSocketEndpoints(prev),
      listenerId,
      webSocketBehaviorSchema.parse(behavior),
    );
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const setSnapshotWebSocketListenerEventEnabled = (
  sessionPath: string,
  listenerId: string,
  eventType: string,
  enabled: boolean,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = setWebSocketListenerEventEnabled(
      snapshotWebSocketEndpoints(prev),
      listenerId,
      eventType,
      enabled,
    );
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const setSnapshotWebSocketListenerCustomResponse = (
  sessionPath: string,
  listenerId: string,
  customResponse: WebSocketResponseConfig,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = setWebSocketListenerCustomResponse(
      snapshotWebSocketEndpoints(prev),
      listenerId,
      customResponse,
    );
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const setSnapshotWebSocketListenerResponse = (
  sessionPath: string,
  listenerId: string,
  response: WebSocketResponseConfig,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = setWebSocketListenerResponse(
      snapshotWebSocketEndpoints(prev),
      listenerId,
      response,
    );
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const setSnapshotWebSocketListenerEventBehavior = (
  sessionPath: string,
  listenerId: string,
  eventType: string,
  behavior: WebSocketEndpointConfig["listeners"][number]["behavior"],
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = setWebSocketListenerEventBehavior(
      snapshotWebSocketEndpoints(prev),
      listenerId,
      eventType,
      webSocketBehaviorSchema.parse(behavior),
    );
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });
export const setSnapshotWebSocketListenerEventCustomResponse = (
  sessionPath: string,
  listenerId: string,
  eventType: string,
  response: WebSocketResponseConfig,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = setWebSocketListenerEventCustomResponse(
      snapshotWebSocketEndpoints(prev),
      listenerId,
      eventType,
      response,
    );
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });
export const setSnapshotWebSocketListenerEventResponse = (
  sessionPath: string,
  listenerId: string,
  eventType: string,
  response: WebSocketResponseConfig,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const next = setWebSocketListenerEventResponse(
      snapshotWebSocketEndpoints(prev),
      listenerId,
      eventType,
      response,
    );
    return bumpSnapshot(prev, { webSocket: webSocketEndpointsSchema.parse(next.endpoints) });
  });

export const setSnapshotBehavior = (
  sessionPath: string,
  id: string,
  behavior: HttpHandlerBehavior,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    if (!prev.state.flattenHandlers.some((handler) => handler.id === id))
      throw new Error(`Handler not found for id: ${id}`);
    return bumpSnapshot(prev, {
      flattenHandlers: prev.state.flattenHandlers.map((handler) =>
        handler.id === id ? { ...handler, behavior } : handler,
      ),
    });
  });

export const setSnapshotCustomResponse = (
  sessionPath: string,
  id: string,
  customResponse: HttpResponseConfig,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    if (!prev.state.flattenHandlers.some((handler) => handler.id === id))
      throw new Error(`Handler not found for id: ${id}`);
    return bumpSnapshot(prev, {
      flattenHandlers: prev.state.flattenHandlers.map((handler) =>
        handler.id === id ? { ...handler, customResponse } : handler,
      ),
    });
  });

export const addSnapshotTempHandler = (
  sessionPath: string,
  data: TempHandlerInput,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const id = getRowId({ path: data.path, method: data.method });
    if (prev.state.flattenHandlers.some((handler) => handler.id === id))
      throw new Error(`Duplicate handler id: ${id}. Change method or path.`);
    const entry: SerializableFlattenHandler = {
      id,
      path: data.path,
      method: data.method,
      behavior: HttpHandlerBehavior.DEFAULT,
      type: "temp",
      tempInput: data,
    };
    return bumpSnapshot(prev, { flattenHandlers: [...prev.state.flattenHandlers, entry] });
  });

export const removeSnapshotTempHandler = (
  sessionPath: string,
  id: string,
): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => {
    const target = prev.state.flattenHandlers.find((handler) => handler.id === id);
    if (!target) throw new Error(`Handler not found for the given id: ${id}`);
    if (target.type !== "temp")
      throw new Error(
        `Handlers generated from codebase cannot be deleted (id: ${id}). You can only disable them.`,
      );
    return bumpSnapshot(prev, {
      flattenHandlers: prev.state.flattenHandlers.filter((handler) => handler.id !== id),
    });
  });

export const requestSnapshotReset = (sessionPath: string): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) =>
    bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers, pendingReset: true }),
  );
