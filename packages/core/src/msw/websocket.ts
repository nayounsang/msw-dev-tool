import {
  ws as originalWs,
  type WebSocketEventListener,
  type WebSocketLink,
} from "msw";
import {
  attachWebSocketHandlerBindHook,
  type WebSocketStoreAdapter,
} from "../shared/websocket/bind";

type WebSocketConnection = Parameters<WebSocketEventListener<"connection">>[0];
type WebSocketClient = WebSocketConnection["client"];

/**
 * MSW does not expose a matcher-to-endpoint formatter,
 * so format the matcher locally for display.
 */
const endpointFromMatcher = (matcher: string | RegExp): string =>
  typeof matcher === "string" ? matcher : `/${matcher.source}/${matcher.flags}`;

const createProxyClient = (
  client: WebSocketClient,
  endpointId: string,
  adapter: WebSocketStoreAdapter,
): WebSocketClient => {
  let nextMessageListenerOrder = 0;
  /**
   * Cache method wrappers to preserve method identity and call native Client
   * methods with the original Client as `this`.
   */
  const methods = new Map<PropertyKey, unknown>();

  return new Proxy(client, {
    get(target, property) {
      const cached = methods.get(property);
      if (cached) return cached;
      if (property === "addEventListener") {
        const addEventListener: WebSocketClient["addEventListener"] = (
          type,
          listener,
          options,
        ) => {
          // Only message listeners are discovered. Lifecycle events (`close` and
          // `error`) are reserved for future support.
          if (type === "message") {
            const order = nextMessageListenerOrder++;
            adapter.registerCodeWebSocketListener({
              id: `${endpointId}:message:${order}`,
              endpointId,
              order,
              event: "message",
              source: "code",
            });
          }
          Reflect.apply(target.addEventListener, target, [
            type,
            listener,
            options,
          ]);
        };
        methods.set(property, addEventListener);
        return addEventListener;
      }

      const value = Reflect.get(target, property, target);
      // Read non-method properties from the original Client, including getters.
      if (typeof value !== "function") return value;
      // Bind methods so calls through the Proxy use the original Client as `this`.
      const bound = value.bind(target);
      methods.set(property, bound);
      return bound;
    },
  });
};

const createWrappedLink = (
  matcher: Parameters<typeof originalWs.link>[0],
): WebSocketLink => {
  const originalLink = originalWs.link(matcher);

  return {
    addEventListener(event, listener) {
      let adapter: WebSocketStoreAdapter | undefined;
      let endpointId = "";
      const handler = originalLink.addEventListener(event, (connection) => {
        if (!adapter) {
          listener(connection);
          return;
        }
        listener({
          ...connection,
          client: createProxyClient(connection.client, endpointId, adapter),
        });
      });

      endpointId = handler.id;
      const hook = attachWebSocketHandlerBindHook(handler);
      const endpoint = {
        id: endpointId,
        endpoint: endpointFromMatcher(matcher),
        source: "code" as const,
      };
      const bind = hook.bind;
      hook.bind = (nextAdapter) => {
        bind.call(hook, nextAdapter);
        adapter = nextAdapter;
        adapter.registerCodeWebSocketEndpoint(endpoint);
      };
      return handler;
    },
    get clients() {
      return originalLink.clients;
    },
    broadcast(data) {
      return originalLink.broadcast(data);
    },
    broadcastExcept(clients, data) {
      return originalLink.broadcastExcept(clients, data);
    },
  };
};

export const wrappedWs: typeof originalWs = { link: createWrappedLink };
