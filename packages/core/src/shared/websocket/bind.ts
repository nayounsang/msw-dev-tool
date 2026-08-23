import { z } from "zod";

import type { ManagedWebSocketEndpoint, ManagedWebSocketListener } from "../types/websocket";
import type { WebSocketEndpointConfig, WebSocketListenerConfig } from "../types/websocket";
import type { WebSocketData } from "msw";

export type ManagedWebSocketClient = {
  send: (data: WebSocketData) => void;
  close: (code?: number, reason?: string) => void;
};

export const WEBSOCKET_HANDLER_BIND = Symbol.for("@msw-dev-tool/core/websocket-handler-bind/v1");

export type WebSocketMessageListenerRegistration = {
  reconnect: () => void;
  disconnect?: () => void;
};

export type WebSocketStoreAdapter = {
  registerCodeWebSocketEndpoint(endpoint: ManagedWebSocketEndpoint): void;
  registerCodeWebSocketListener(listener: ManagedWebSocketListener): void;
  getWebSocketEndpoint(endpointId: string): WebSocketEndpointConfig | undefined;
  getWebSocketListener(listenerId: string): WebSocketListenerConfig | undefined;
  registerWebSocketConnection(endpointId: string, client: ManagedWebSocketClient): void;
  unregisterWebSocketConnection(endpointId: string, client: ManagedWebSocketClient): void;
  registerWebSocketMessageListener(
    endpointId: string,
    registration: WebSocketMessageListenerRegistration,
  ): void;
  unregisterWebSocketMessageListener(
    endpointId: string,
    registration: WebSocketMessageListenerRegistration,
  ): void;
  connectWebSocket(endpointId: string, server: { connect: () => void }): void;
  dispatchWebSocketMessage(
    endpointId: string,
    client: ManagedWebSocketClient,
    event: Event,
    listenerId?: string,
    original?: (event: Event) => void,
  ): void;
  closeWebSocketConnections(endpointId: string): void;
  resetWebSocketConnections(): void;
};

type WebSocketHandlerBindHook = {
  bind(adapter: WebSocketStoreAdapter): void;
  getAdapter(): WebSocketStoreAdapter | undefined;
};

const webSocketHandlerBindHookSchema = z.object({
  bind: z.function(),
});

export const attachWebSocketHandlerBindHook = (handler: object): WebSocketHandlerBindHook => {
  let adapter: WebSocketStoreAdapter | undefined;
  const hook: WebSocketHandlerBindHook = {
    bind(nextAdapter) {
      adapter = nextAdapter;
    },
    getAdapter: () => adapter,
  };

  Object.defineProperty(handler, WEBSOCKET_HANDLER_BIND, {
    value: hook,
  });
  return hook;
};

export const bindWebSocketHandler = (handler: unknown, adapter: WebSocketStoreAdapter): boolean => {
  if ((typeof handler !== "object" && typeof handler !== "function") || !handler) {
    return false;
  }
  const hook = Reflect.get(handler, WEBSOCKET_HANDLER_BIND);
  const result = webSocketHandlerBindHookSchema.safeParse(hook);
  if (!result.success) {
    return false;
  }
  result.data.bind(adapter);
  return true;
};
