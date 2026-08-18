import { z } from "zod";

import type {
  ManagedWebSocketEndpoint,
  ManagedWebSocketListener,
} from "../types/websocket";
import type { WebSocketEndpointConfig, WebSocketListenerConfig } from "../types/websocket";

export const WEBSOCKET_HANDLER_BIND = Symbol.for(
  "@msw-dev-tool/core/websocket-handler-bind/v1"
);

export type WebSocketStoreAdapter = {
  registerCodeWebSocketEndpoint(endpoint: ManagedWebSocketEndpoint): void;
  registerCodeWebSocketListener(listener: ManagedWebSocketListener): void;
  getWebSocketEndpoint(endpointId: string): WebSocketEndpointConfig | undefined;
  getWebSocketListener(listenerId: string): WebSocketListenerConfig | undefined;
  registerWebSocketConnection(endpointId: string, client: { close: (code?: number, reason?: string) => void }): void;
  registerWebSocketMessageListener(endpointId: string, reconnect: () => void): void;
  connectWebSocket(endpointId: string, server: { connect: () => void }): void;
  dispatchWebSocketMessage(endpointId: string, client: { send: (data: string) => void; close: (code?: number, reason?: string) => void }, event: Event, listenerId?: string, original?: (event: Event) => void): void;
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

export const attachWebSocketHandlerBindHook = (
  handler: object
): WebSocketHandlerBindHook => {
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

export const bindWebSocketHandler = (
  handler: unknown,
  adapter: WebSocketStoreAdapter
): boolean => {
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
