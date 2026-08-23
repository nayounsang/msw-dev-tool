import { ws as originalWs, type WebSocketEventListener, type WebSocketLink } from "msw";
import {
  attachWebSocketHandlerBindHook,
  type WebSocketStoreAdapter,
} from "../shared/websocket/bind";
import type { ManagedWebSocketListener } from "../shared/types";
import type { SerializableWebSocketMatcher } from "../shared/types";

type WebSocketConnection = Parameters<WebSocketEventListener<"connection">>[0];
type WebSocketClient = WebSocketConnection["client"];

/**
 * MSW does not expose a matcher-to-endpoint formatter,
 * so format the matcher locally for display.
 */
const endpointFromMatcher = (matcher: string | RegExp): string =>
  typeof matcher === "string" ? matcher : `/${matcher.source}/${matcher.flags}`;

const serializeMatcher = (matcher: string | RegExp): SerializableWebSocketMatcher =>
  typeof matcher === "string"
    ? { kind: "string", value: matcher }
    : { kind: "regexp", source: matcher.source, flags: matcher.flags };

const createProxyClient = (
  client: WebSocketClient,
  endpointId: string,
  registerListener: (listener: ManagedWebSocketListener) => void,
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
        const addEventListener: WebSocketClient["addEventListener"] = (type, listener, options) => {
          // Only message listeners are discovered. Lifecycle events (`close` and
          // `error`) are reserved for future support.
          if (type === "message") {
            if (typeof listener !== "function") {
              Reflect.apply(target.addEventListener, target, [type, listener, options]);
              return;
            }
            const order = nextMessageListenerOrder++;
            const listenerId = `${endpointId}:message:${order}`;
            registerListener({
              id: listenerId,
              endpointId,
              order,
              event: "message",
              source: "code",
            });
            const dispatch = (event: Event) =>
              adapter.dispatchWebSocketMessage(endpointId, target, event, listenerId, (nextEvent) =>
                Reflect.apply(listener, target, [nextEvent]),
              );
            Reflect.apply(target.addEventListener, target, [type, dispatch, options]);
            const registration = {
              reconnect: () => {
                Reflect.apply(target.addEventListener, target, [type, dispatch, options]);
              },
              disconnect: () => {
                Reflect.apply(target.removeEventListener, target, [type, dispatch, options]);
              },
            };
            adapter.registerWebSocketMessageListener(endpointId, registration);
            target.addEventListener(
              "close",
              () => {
                adapter.unregisterWebSocketMessageListener(endpointId, registration);
              },
              { once: true },
            );
            return;
          }
          Reflect.apply(target.addEventListener, target, [type, listener, options]);
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

const createWrappedLink = (matcher: Parameters<typeof originalWs.link>[0]): WebSocketLink => {
  const originalLink = originalWs.link(matcher);

  return {
    addEventListener(event, listener) {
      let adapter: WebSocketStoreAdapter | undefined;
      let endpointId = "";
      const discoveredListeners = new Map<string, ManagedWebSocketListener>();
      const registerListener = (entry: ManagedWebSocketListener) => {
        discoveredListeners.set(entry.id, entry);
        adapter?.registerCodeWebSocketListener(entry);
      };
      const handler = originalLink.addEventListener(event, (connection) => {
        if (!adapter) {
          listener(connection);
          return;
        }
        const boundAdapter = adapter;
        boundAdapter.registerWebSocketConnection(endpointId, connection.client);
        connection.client.addEventListener(
          "close",
          () => {
            boundAdapter.unregisterWebSocketConnection(endpointId, connection.client);
          },
          { once: true },
        );
        if (!boundAdapter.getWebSocketEndpoint(endpointId)?.enabled) {
          boundAdapter.connectWebSocket(endpointId, connection.server);
          return;
        }
        listener({
          ...connection,
          client: createProxyClient(connection.client, endpointId, registerListener, boundAdapter),
        });
      });

      endpointId = handler.id;
      const hook = attachWebSocketHandlerBindHook(handler);
      const endpoint = {
        id: endpointId,
        endpoint: endpointFromMatcher(matcher),
        source: "code" as const,
        matcher: serializeMatcher(matcher),
      };
      const bind = hook.bind;
      hook.bind = (nextAdapter) => {
        bind.call(hook, nextAdapter);
        adapter = nextAdapter;
        nextAdapter.registerCodeWebSocketEndpoint(endpoint);
        discoveredListeners.forEach((entry) => nextAdapter.registerCodeWebSocketListener(entry));
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

/** Creates a live MSW handler for a temporary endpoint. */
export const createTemporaryWebSocketHandler = (
  matcher: string | RegExp,
  endpointId: string,
  adapter: WebSocketStoreAdapter,
) =>
  originalWs.link(matcher).addEventListener("connection", ({ client, server }) => {
    adapter.registerWebSocketConnection(endpointId, client);
    client.addEventListener(
      "close",
      () => {
        adapter.unregisterWebSocketConnection(endpointId, client);
      },
      { once: true },
    );
    if (!adapter.getWebSocketEndpoint(endpointId)?.enabled) {
      adapter.connectWebSocket(endpointId, server);
      return;
    }
    const dispatch = (event: Event) => {
      adapter.dispatchWebSocketMessage(endpointId, client, event, undefined, undefined);
    };
    client.addEventListener("message", dispatch);
    const registration = {
      reconnect: () => {
        client.addEventListener("message", dispatch);
      },
      disconnect: () => {
        client.removeEventListener("message", dispatch);
      },
    };
    adapter.registerWebSocketMessageListener(endpointId, registration);
    client.addEventListener(
      "close",
      () => {
        adapter.unregisterWebSocketMessageListener(endpointId, registration);
      },
      { once: true },
    );
  });
