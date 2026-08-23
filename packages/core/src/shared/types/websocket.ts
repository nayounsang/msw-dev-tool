export type SerializableWebSocketMatcher =
  { kind: "string"; value: string } | { kind: "regexp"; source: string; flags: string };

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

export type WebSocketSendDataType = "string" | "Blob" | "ArrayBuffer";

type WebSocketResponsePayload =
  | {
      type: "send";
      dataType: WebSocketSendDataType;
      value: string;
      metadata?: { type?: string };
    }
  | {
      type: "close";
      code?: number;
      reason?: string;
    };

export type WebSocketRepeat = {
  interval: number;
  repetitions: number | "Infinity";
};

export type WebSocketResponseConfig = WebSocketResponsePayload & {
  delay?: number;
  repeat?: WebSocketRepeat;
};

export type DevToolHandlerInfo = {
  id: string;
  kind: "http" | "websocket";
  endpoint: string;
  operation: string;
  source: "code" | "temp";
};

export type WebSocketBehaviorSelection =
  | { preset: "default" }
  | { preset: "send"; options: { message: string } }
  | { preset: "close"; options?: { code?: number; reason?: string } }
  | { preset: "echo" }
  | { preset: "send-null" }
  | { preset: "no-reply" }
  | { preset: "send-sequence" }
  | { preset: "custom response" };

export type WebSocketHandlerInfo = Omit<DevToolHandlerInfo, "kind"> & { kind: "websocket" };

export type WebSocketListenerConfig = {
  info: WebSocketHandlerInfo;
  endpointId: string;
  event: "message";
  enabled: boolean;
  behavior: WebSocketBehaviorSelection;
  response?: WebSocketResponseConfig;
  customResponse?: WebSocketResponseConfig;
};

export type AddWebSocketListenerInput = {
  endpointId: string;
  behavior?: WebSocketBehaviorSelection;
  response?: WebSocketResponseConfig;
  customResponse?: WebSocketResponseConfig;
};

export type WebSocketEndpointConfig = {
  info: WebSocketHandlerInfo;
  endpointId: string;
  matcher: SerializableWebSocketMatcher;
  enabled: boolean;
  listeners: WebSocketListenerConfig[];
};
