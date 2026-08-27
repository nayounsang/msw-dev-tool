import { ws as originalWs, type WebSocketEventListener, type WebSocketLink } from "msw";
import { z } from "zod";
import {
  attachWebSocketHandlerBindHook,
  type WebSocketStoreAdapter,
} from "../shared/websocket/bind";
import type { ManagedWebSocketListener, WebSocketMessageListenerOptions } from "../shared/types";
import type { SerializableWebSocketMatcher } from "../shared/types";

type WebSocketConnection = Parameters<WebSocketEventListener<"connection">>[0];
type WebSocketClient = WebSocketConnection["client"];
type WrappedWebSocketClient = WebSocketClient & {
  addEventListener<TData = unknown>(
    type: "message",
    listener: (event: MessageEvent<TData>) => void,
    options?: WebSocketMessageListenerOptions<TData>,
  ): void;
};
type WrappedWebSocketConnection = Omit<WebSocketConnection, "client"> & {
  client: WrappedWebSocketClient;
};
export type WrappedWebSocketLink = Omit<WebSocketLink, "addEventListener"> & {
  addEventListener(
    event: "connection",
    listener: (connection: WrappedWebSocketConnection) => void,
  ): ReturnType<WebSocketLink["addEventListener"]>;
};

const webSocketClientShapeSchema = z
  .object({
    addEventListener: z.function(),
    send: z.function(),
    close: z.function(),
  })
  .passthrough();
const wrappedWebSocketClientSchema = z.custom<WrappedWebSocketClient>(
  (value) => webSocketClientShapeSchema.safeParse(value).success,
);
const webSocketConnectionShapeSchema = z
  .object({
    client: webSocketClientShapeSchema,
    server: z.object({ connect: z.function() }).passthrough(),
  })
  .passthrough();
const wrappedWebSocketConnectionSchema = z.custom<WrappedWebSocketConnection>(
  (value) => webSocketConnectionShapeSchema.safeParse(value).success,
);
const messageEventSchema = z.object({ data: z.unknown() }).passthrough();
const messageRoutingSchema = z.object({
  eventTypes: z.array(z.string()),
  resolveEventType: z.function().args(z.unknown()).returns(z.string()),
});
const messageListenerOptionsSchema = z
  .object({ mswDevTool: messageRoutingSchema.optional() })
  .passthrough();
const nativeMessageListenerOptionsSchema = z
  .object({
    capture: z.boolean().optional(),
    once: z.boolean().optional(),
    passive: z.boolean().optional(),
    signal: z.instanceof(AbortSignal).optional(),
    mswDevTool: z.unknown().optional(),
  })
  .passthrough()
  .transform(({ mswDevTool: _mswDevTool, ...options }) => options);

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
): WrappedWebSocketClient => {
  let nextMessageListenerOrder = 0;
  /**
   * Cache method wrappers to preserve method identity and call native Client
   * methods with the original Client as `this`.
   */
  const methods = new Map<PropertyKey, unknown>();

  const proxy = new Proxy(client, {
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
            const routing = messageListenerOptionsSchema.safeParse(options);
            registerListener({
              id: listenerId,
              endpointId,
              order,
              event: "message",
              source: "code",
              eventTypes: routing.success ? routing.data.mswDevTool?.eventTypes : undefined,
            });
            const dispatch = (event: Event) => {
              const original = (nextEvent: Event) => Reflect.apply(listener, target, [nextEvent]);
              const messageEvent = messageEventSchema.safeParse(event);
              if (!routing.success || !routing.data.mswDevTool || !messageEvent.success) {
                adapter.dispatchWebSocketMessage(endpointId, target, event, listenerId, original);
                return;
              }
              try {
                const eventType = routing.data.mswDevTool.resolveEventType(messageEvent.data.data);
                if (!routing.data.mswDevTool.eventTypes.includes(eventType)) {
                  original(event);
                  return;
                }
                adapter.dispatchWebSocketMessage(
                  endpointId,
                  target,
                  event,
                  listenerId,
                  original,
                  eventType,
                );
              } catch {
                original(event);
              }
            };
            const nativeOptions = nativeMessageListenerOptionsSchema.safeParse(options);
            const registeredOptions = nativeOptions.success ? nativeOptions.data : options;
            Reflect.apply(target.addEventListener, target, [type, dispatch, registeredOptions]);
            const registration = {
              reconnect: () => {
                Reflect.apply(target.addEventListener, target, [type, dispatch, registeredOptions]);
              },
              disconnect: () => {
                Reflect.apply(target.removeEventListener, target, [
                  type,
                  dispatch,
                  registeredOptions,
                ]);
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

  return wrappedWebSocketClientSchema.parse(proxy);
};

const createWrappedLink = (
  matcher: Parameters<typeof originalWs.link>[0],
): WrappedWebSocketLink => {
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
          listener(wrappedWebSocketConnectionSchema.parse(connection));
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
        listener(
          wrappedWebSocketConnectionSchema.parse({
            ...connection,
            client: createProxyClient(
              connection.client,
              endpointId,
              registerListener,
              boundAdapter,
            ),
          }),
        );
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

export const wrappedWs = { link: createWrappedLink };

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
