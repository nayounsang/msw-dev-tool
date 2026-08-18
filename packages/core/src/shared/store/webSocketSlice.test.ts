import { describe, expect, it, vi } from "vitest";
import { createHandlerRegistry } from "./commonSlice";
import { createWebSocketSlice } from "./webSocketSlice";

describe("WebSocket state model", () => {
  it("registers code hierarchy and prevents duplicate discovery", () => {
    const slice = createWebSocketSlice();
    const info = {
      id: "code-endpoint",
      kind: "websocket" as const,
      endpoint: "ws://example.test/chat",
      operation: "endpoint",
      source: "code" as const,
    };

    slice.registerCodeEndpoint({
      info,
      matcher: { kind: "regexp", source: "^chat$", flags: "i" },
    });
    slice.registerCodeEndpoint({
      info,
      matcher: { kind: "string", value: "different" },
    });
    slice.registerCodeListener({
      info: { ...info, id: "code-listener", operation: "message" },
      endpointId: info.id,
      event: "message",
    });
    slice.registerCodeListener({
      info: { ...info, id: "code-listener", operation: "message" },
      endpointId: info.id,
      event: "message",
    });

    expect(slice.getState().endpoints).toHaveLength(1);
    expect(slice.getState().endpoints[0]?.matcher).toEqual({
      kind: "regexp",
      source: "^chat$",
      flags: "i",
    });
    expect(slice.getState().listeners).toHaveLength(1);
  });

  it("manages temporary lifecycle, behavior, enabled state, and runtime cleanup", () => {
    const runtime = {
      addTempEndpoint: vi.fn(),
      removeEndpoint: vi.fn(),
      closeEndpointConnections: vi.fn(),
      resetTempEndpoints: vi.fn(),
    };
    const slice = createWebSocketSlice(runtime);
    const endpointId = slice.addTempEndpoint({
      endpoint: "ws://example.test/temp",
      matcher: { kind: "string", value: "ws://example.test/temp" },
    });
    const listenerId = slice.addTempListener({
      endpointId,
      behavior: { preset: "reply", options: { body: "ok" } },
    });

    slice.setEndpointEnabled(endpointId, false);
    slice.setListenerEnabled(listenerId, false);
    slice.setListenerBehavior(listenerId, { preset: "drop" });

    expect(slice.getState().endpoints[0]).toMatchObject({ endpointId, enabled: false });
    expect(slice.getState().listeners[0]).toMatchObject({
      info: { id: listenerId, source: "temp" },
      enabled: false,
      behavior: { preset: "drop" },
    });
    expect(runtime.addTempEndpoint).toHaveBeenCalledOnce();
    expect(runtime.closeEndpointConnections).toHaveBeenCalledWith(endpointId);

    slice.removeEndpoint(endpointId);
    expect(slice.getState()).toEqual({ endpoints: [], listeners: [] });
    expect(runtime.removeEndpoint).toHaveBeenCalledWith(endpointId);
  });

  it("keeps code entries on reset and rejects deleting them", () => {
    const slice = createWebSocketSlice();
    const codeInfo = {
      id: "code",
      kind: "websocket" as const,
      endpoint: "ws://example.test/code",
      operation: "endpoint",
      source: "code" as const,
    };
    slice.registerCodeEndpoint({ info: codeInfo, matcher: { kind: "string", value: codeInfo.endpoint } });
    expect(() => slice.removeEndpoint(codeInfo.id)).toThrow("cannot be deleted");

    slice.addTempEndpoint({ endpoint: "ws://example.test/temp", matcher: { kind: "string", value: "temp" } });
    slice.reset();
    expect(slice.getState().endpoints.map((entry) => entry.info.id)).toEqual([codeInfo.id]);
  });
});

describe("handler registry", () => {
  it("filters metadata and clears temporary entries", () => {
    const registry = createHandlerRegistry();
    registry.registerHandler({ id: "http", kind: "http", endpoint: "/users", operation: "get", source: "code" });
    registry.registerHandler({ id: "ws", kind: "websocket", endpoint: "ws://example.test", operation: "endpoint", source: "temp" });

    expect(registry.listHandlerInfo("websocket")).toHaveLength(1);
    registry.clearTempHandlers();
    expect(registry.listHandlerInfo()).toEqual([
      { id: "http", kind: "http", endpoint: "/users", operation: "get", source: "code" },
    ]);
  });
});
