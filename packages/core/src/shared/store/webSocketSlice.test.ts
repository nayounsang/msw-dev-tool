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

  it("updates one listener response and schedule without replacing sibling listener state", () => {
    const slice = createWebSocketSlice();
    const endpointId = slice.addTempEndpoint({
      endpoint: "ws://example.test/configured",
      matcher: { kind: "string", value: "ws://example.test/configured" },
    });
    const first = slice.addTempListener({ endpointId });
    const second = slice.addTempListener({ endpointId, behavior: { preset: "echo" } });

    slice.setListenerCustomResponse(first, { type: "send", dataType: "string", value: "custom" });
    slice.setListenerResponse(first, { type: "send", dataType: "string", value: "default" });
    slice.setListenerSchedule(first, { delay: 300, repeat: { interval: 500, repetitions: 3 } });

    expect(slice.getState().listeners).toEqual([
      expect.objectContaining({
        info: expect.objectContaining({ id: first }),
        customResponse: expect.objectContaining({ value: "custom" }),
        response: expect.objectContaining({ value: "default" }),
        delay: 300,
        repeat: { interval: 500, repetitions: 3 },
      }),
      expect.objectContaining({
        info: expect.objectContaining({ id: second }),
        behavior: { preset: "echo" },
      }),
    ]);
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

  it("rejects orphan listeners and supports enabling code endpoints", () => {
    const slice = createWebSocketSlice();
    expect(() => slice.addTempListener({ endpointId: "missing", behavior: { preset: "reply" } })).toThrow("not found");
    expect(() => slice.removeEndpoint("missing")).toThrow("not found");
    expect(() => slice.setEndpointEnabled("missing", true)).toThrow("not found");
    expect(() => slice.setListenerEnabled("missing", true)).toThrow("not found");
    expect(() => slice.setListenerBehavior("missing", { preset: "reply" })).toThrow("not found");
    slice.registerCodeListener({
      info: {
        id: "orphan",
        kind: "websocket",
        endpoint: "ws://example.test",
        operation: "message",
        source: "code",
      },
      endpointId: "missing",
      event: "message",
    });
    expect(slice.getState().listeners).toHaveLength(0);

    slice.registerCodeEndpoint({
      info: {
        id: "code-enabled",
        kind: "websocket",
        endpoint: "ws://example.test",
        operation: "endpoint",
        source: "code",
      },
      matcher: { kind: "string", value: "ws://example.test" },
    });
    slice.setEndpointEnabled("code-enabled", true);
    expect(slice.getState().endpoints[0]?.enabled).toBe(true);
  });

  it("avoids endpoint ID collisions after hydrating temporary state", () => {
    const slice = createWebSocketSlice();
    const matcher = { kind: "string" as const, value: "ws://example.test/temp" };
    const first = slice.addTempEndpoint({ endpoint: matcher.value, matcher });
    const saved = slice.getState().endpoints;
    slice.replace([]);
    slice.hydrate(saved);

    const second = slice.addTempEndpoint({ endpoint: matcher.value, matcher });

    expect(second).not.toBe(first);
    expect(slice.getState().endpoints).toHaveLength(2);
  });

  it("hydrates saved code endpoint state while preserving unsaved code endpoints", () => {
    const slice = createWebSocketSlice();
    const codeInfo = (id: string) => ({
      id,
      kind: "websocket" as const,
      endpoint: `ws://example.test/${id}`,
      operation: "endpoint",
      source: "code" as const,
    });
    slice.registerCodeEndpoint({ info: codeInfo("saved-code"), matcher: { kind: "string", value: "saved-code" } });
    slice.registerCodeEndpoint({ info: codeInfo("live-code"), matcher: { kind: "string", value: "live-code" } });
    const tempId = slice.addTempEndpoint({
      endpoint: "ws://example.test/hydrated-temp",
      matcher: { kind: "string", value: "hydrated-temp" },
    });
    const saved = slice.getState().endpoints
      .filter((entry) => entry.endpointId !== "live-code")
      .map((entry) => entry.endpointId === "saved-code" ? { ...entry, enabled: false } : entry);

    slice.hydrate(saved);

    expect(slice.getState().endpoints).toEqual([
      expect.objectContaining({ endpointId: "saved-code", enabled: false }),
      expect.objectContaining({ endpointId: "live-code", enabled: true }),
      expect.objectContaining({ endpointId: tempId, info: expect.objectContaining({ source: "temp" }) }),
    ]);
  });

  it("allocates a fresh listener ID after an earlier listener is removed", () => {
    const slice = createWebSocketSlice();
    const endpointId = slice.addTempEndpoint({
      endpoint: "ws://example.test/temp",
      matcher: { kind: "string", value: "temp" },
    });
    const first = slice.addTempListener({ endpointId, behavior: { preset: "one" } });
    const second = slice.addTempListener({ endpointId, behavior: { preset: "two" } });
    slice.removeListener(first);
    const third = slice.addTempListener({ endpointId, behavior: { preset: "three" } });

    expect(third).not.toBe(second);
    expect(slice.getState().listeners.map((entry) => entry.info.id)).toEqual([second, third]);
  });
});

describe("handler registry", () => {
  it("filters metadata and clears temporary entries", () => {
    const registry = createHandlerRegistry();
    registry.registerHandler({ id: "http", kind: "http", endpoint: "/users", operation: "get", source: "code" });
    registry.registerHandler({ id: "ws", kind: "websocket", endpoint: "ws://example.test", operation: "endpoint", source: "temp" });

    expect(registry.listHandlerInfo("websocket")).toHaveLength(1);
    registry.clearTempHandlers("websocket");
    expect(registry.listHandlerInfo("http")).toHaveLength(1);
    expect(registry.listHandlerInfo("websocket")).toHaveLength(0);
    registry.registerHandler({ id: "ws-again", kind: "websocket", endpoint: "ws://example.test", operation: "endpoint", source: "temp" });
    registry.clearTempHandlers();
    expect(registry.listHandlerInfo()).toEqual([
      { id: "http", kind: "http", endpoint: "/users", operation: "get", source: "code" },
    ]);
  });
});
