export type SerializableWebSocketMatcher =
  | { kind: "string"; value: string }
  | { kind: "regexp"; source: string; flags: string };

export type ManagedWebSocketEndpoint = {
  id: string;
  endpoint: string;
  source: "code";
  matcher?: SerializableWebSocketMatcher;
};

export type ManagedWebSocketListener = {
  id: string;
  endpointId: string;
  order: number;
  event: "message";
  source: "code";
};

export type ManagedWebSocketRegistration = {
  endpoint: ManagedWebSocketEndpoint;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type DevToolHandlerInfo = {
  id: string;
  kind: "http" | "websocket";
  endpoint: string;
  operation: string;
  source: "code" | "temp";
};

export type WebSocketBehaviorSelection = {
  preset: string;
  options?: JsonValue;
};

export type WebSocketHandlerInfo = Omit<DevToolHandlerInfo, "kind"> & { kind: "websocket" };

export type WebSocketListenerConfig = {
  info: WebSocketHandlerInfo;
  endpointId: string;
  event: "message";
  enabled: boolean;
  behavior: WebSocketBehaviorSelection;
};

export type WebSocketEndpointConfig = {
  info: WebSocketHandlerInfo;
  endpointId: string;
  matcher: SerializableWebSocketMatcher;
  enabled: boolean;
  listeners: WebSocketListenerConfig[];
};
