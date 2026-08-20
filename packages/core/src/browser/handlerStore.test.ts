import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { ws } from "../msw";

vi.mock("msw/browser", () => ({
  setupWorker: (...handlers: unknown[]) => ({
    listHandlers: () => handlers,
    use: () => undefined,
    resetHandlers: () => undefined,
  }),
}));

import { BROWSER_CONTROL_KEY, BrowserControlBridge, handlerStore, setupDevToolWorker } from "./handlerStore";
import { STORAGE_KEY } from "../shared/const";
import { BROWSER_CONTROL_METHOD_VERSIONS } from "../shared/controlProtocol";

const getBridge = (): BrowserControlBridge => {
  const bridge = window[BROWSER_CONTROL_KEY];
  if (!bridge) throw new Error("Browser control bridge was not registered");
  return bridge;
};

describe("browser control bridge", () => {
  beforeEach(() => sessionStorage.clear());

  it("persists each bridge state transition and restores code handlers on reset", async () => {
    await setupDevToolWorker(http.get("/bridge-handler", () => HttpResponse.json({ ok: true })));
    const bridge = getBridge();
    expect(bridge).toMatchObject({
      version: 2,
      methods: BROWSER_CONTROL_METHOD_VERSIONS,
    });
    const handler = bridge.list()[0];
    const initialRevision = bridge.describe().revision;

    const changed = bridge.setBehavior(handler.id, "delay");
    const tempInput = {
      path: "/bridge-temp",
      method: "get",
      contentType: "application/json",
      status: "200",
      response: "{\"ok\":true}",
    } as const;
    const additions = await Promise.allSettled([
      Promise.resolve().then(() => bridge.addTemp(tempInput)),
      Promise.resolve().then(() => bridge.addTemp(tempInput)),
    ]);
    const added = additions.find(
      (result): result is PromiseFulfilledResult<{ revision: number; handlerCount: number }> =>
        result.status === "fulfilled"
    );

    expect(bridge.get(handler.id)).toMatchObject({ behavior: "delay" });
    expect(changed).toMatchObject({ revision: initialRevision + 1, handler: { id: handler.id, behavior: "delay" } });
    expect(added?.value).toMatchObject({ revision: initialRevision + 2, handler: { type: "temp" } });
    expect(additions.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(bridge.list()).toHaveLength(2);

    const removed = bridge.removeTemp('{"path":"/bridge-temp","method":"get"}');
    const reset = bridge.reset();

    expect(removed.revision).toBe(initialRevision + 3);
    expect(reset.revision).toBe(initialRevision + 4);
    expect(bridge.list()).toEqual([expect.objectContaining({ id: handler.id, behavior: "default", type: "default" })]);
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      revision: reset.revision,
      state: { flattenHandlers: [{ id: handler.id, behavior: "default" }] },
    });
  });

  it("exposes custom response configuration through the handler store", async () => {
    await setupDevToolWorker(http.get("/custom", () => HttpResponse.json({ original: true })));
    const handler = handlerStore.getState().flattenHandlers[0]!;
    const customResponse = {
      body: "custom body",
      headers: { "X-Custom": "yes" },
      status: 202,
    };

    const changed = getBridge().setCustomResponse(handler.id, customResponse);
    handlerStore.getState().setHandlerBehavior(handler.id, "custom response");

    expect(handlerStore.getState().getHandlerCustomResponse(handler.id)).toEqual(customResponse);
    expect(changed.handler).toMatchObject({ id: handler.id, behavior: "default", customResponse });
    const result = await handler.handler.resolver({
      request: new Request("http://localhost/custom"),
      requestId: "1",
      params: {},
      cookies: {},
    });
    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(result.status).toBe(202);
    expect(result.headers.get("X-Custom")).toBe("yes");
    expect(await result.text()).toBe("custom body");
  });

  it("registers wrapped WebSocket endpoints through the browser store adapter", async () => {
    const chat = ws.link("ws://browser.test/chat");
    await setupDevToolWorker(
      chat.addEventListener("connection", () => undefined)
    );

    expect(handlerStore.getState().webSocketEndpoints).toEqual([
      expect.objectContaining({
        endpoint: "ws://browser.test/chat",
        source: "code",
      }),
    ]);
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      state: { flattenHandlers: [] },
    });
  });

  it("exposes WebSocket endpoint and listener mutations through the browser bridge", async () => {
    await setupDevToolWorker();
    const bridge = getBridge();
    const added = bridge.addWebSocketEndpoint({
      kind: "regexp",
      source: "browser\\.example\\.local/cli-e2e",
      flags: "i",
    });
    const listener = bridge.addWebSocketListener(added.endpoint.endpointId, {
      preset: "send",
      options: { message: "hello" },
    });

    expect(bridge.listWebSocket()).toEqual([expect.objectContaining({
      endpointId: added.endpoint.endpointId,
      matcher: { kind: "regexp", source: "browser\\.example\\.local/cli-e2e", flags: "i" },
    })]);
    expect(bridge.getWebSocketEndpoint(added.endpoint.endpointId)).toEqual(listener.endpoint);
    expect(bridge.setWebSocketEndpointEnabled(added.endpoint.endpointId, false).endpoint.enabled).toBe(false);
    expect(bridge.setWebSocketListenerEnabled(listener.listener.info.id, false).listener.enabled).toBe(false);
    expect(bridge.setWebSocketListenerBehavior(listener.listener.info.id, { preset: "close", options: { code: 4001 } }).listener.behavior).toEqual({
      preset: "close", options: { code: 4001 },
    });
    const persistedBeforeInvalidBehavior = sessionStorage.getItem(STORAGE_KEY);
    expect(() => bridge.addWebSocketListener(added.endpoint.endpointId, { preset: "invalid" })).toThrow();
    expect(() => bridge.setWebSocketListenerBehavior(listener.listener.info.id, { preset: "invalid" })).toThrow();
    expect(bridge.getWebSocketEndpoint(added.endpoint.endpointId)?.listeners).toEqual([
      expect.objectContaining({ behavior: { preset: "close", options: { code: 4001 } } }),
    ]);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(persistedBeforeInvalidBehavior);
    expect(bridge.removeWebSocketListener(listener.listener.info.id).endpoints[0]?.listeners).toEqual([]);
    expect(bridge.removeWebSocketEndpoint(added.endpoint.endpointId).endpoints).toEqual([]);
    const matcher = { kind: "string" as const, value: "ws://browser.test/load" };
    const results = await Promise.all(
      Array.from({ length: 20 }, () => Promise.resolve().then(() => bridge.addWebSocketEndpoint(matcher)))
    );

    expect(new Set(results.map((result) => result.endpoint.endpointId)).size).toBe(20);
    expect(bridge.listWebSocket()).toHaveLength(20);
    expect(() => bridge.removeWebSocketEndpoint("missing-endpoint")).toThrow(
      "WebSocket endpoint not found: missing-endpoint"
    );
  });

  it("keeps HTTP temp metadata when hydrating WebSocket state", async () => {
    await setupDevToolWorker(http.get("/hydrate", () => HttpResponse.json({ ok: true })));
    const state = handlerStore.getState();
    const endpointId = state.addTempWebSocketEndpoint({
      endpoint: "ws://browser.test/temp",
      matcher: { kind: "string", value: "ws://browser.test/temp" },
    });
    state.addTempHandler({
      data: {
        path: "/hydrate-temp",
        method: "get",
        contentType: "application/json",
        status: "200",
      },
    });

    expect(state.getHandlerInfo(endpointId)?.source).toBe("temp");
    handlerStore.getState().hydrateWebSocket([]);

    expect(handlerStore.getState().getHandlerInfo(endpointId)).toBeUndefined();
    expect(handlerStore.getState().listHandlerInfo("http")).toEqual(
      expect.arrayContaining([expect.objectContaining({ endpoint: "/hydrate-temp", source: "temp" })])
    );
    expect(handlerStore.getState().webSocketEndpoints).toEqual([]);
  });

  it("hydrates valid WebSocket state from sessionStorage", async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      state: {
        flattenHandlers: [],
        webSocket: [{
          info: {
            id: "websocket:endpoint:string:ws://browser.test/saved:0",
            kind: "websocket",
            endpoint: "ws://browser.test/saved",
            operation: "endpoint",
            source: "temp",
          },
          endpointId: "websocket:endpoint:string:ws://browser.test/saved:0",
          matcher: { kind: "string", value: "ws://browser.test/saved" },
          enabled: true,
          listeners: [],
        }],
      },
    }));

    await setupDevToolWorker();

    expect(handlerStore.getState().getWebSocketEndpoint("websocket:endpoint:string:ws://browser.test/saved:0")).toBeDefined();
  });

  it("ignores public snapshot assignments for closure-backed slices", async () => {
    const chat = ws.link("ws://browser.test/closure");
    await setupDevToolWorker(chat.addEventListener("connection", () => undefined));
    const endpointId = handlerStore.getState().webSocket.endpoints[0]!.endpointId;
    const before = handlerStore.getState().getWebSocketEndpoint(endpointId);

    handlerStore.setState({ common: { handlers: [] }, webSocket: { endpoints: [], listeners: [] } });

    expect(handlerStore.getState().common.handlers.length).toBeGreaterThan(0);
    expect(handlerStore.getState().getWebSocketEndpoint(endpointId)).toEqual(before);
  });

  it("maps direct object and functional updates to the base store", async () => {
    await setupDevToolWorker(http.get("/state", () => HttpResponse.json({ ok: true })));
    const initial = handlerStore.getState();

    handlerStore.setState({ worker: initial.worker });
    handlerStore.setState({ flattenHandlers: initial.flattenHandlers });
    handlerStore.setState({ restHandlers: ["unsupported"] });
    handlerStore.setState((current) => ({
      restHandlers: [...current.restHandlers, "another"],
    }));

    expect(handlerStore.getState().restHandlers).toEqual([
      "unsupported",
      "another",
    ]);
    expect(handlerStore.getState().flattenHandlers).toEqual(
      initial.flattenHandlers
    );
  });

  it("rejects control requests for missing handlers", async () => {
    await setupDevToolWorker(http.get("/missing", () => HttpResponse.json({ ok: true })));
    const bridge = getBridge();

    expect(bridge.get("missing")).toBeUndefined();
    expect(() => bridge.setBehavior("missing", "delay")).toThrow(
      "Handler not found"
    );
  });
});
