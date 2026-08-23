import { describe, expect, it } from "vitest";
import {
  serializableWebSocketMatcherSchema,
  webSocketBehaviorSchema,
  webSocketCustomResponseSchema,
  webSocketResponseSchema,
  webSocketRepeatSchema,
  webSocketListenerSchema,
  webSocketEndpointsSchema,
} from "./websocket";

describe("websocket schema", () => {
  it("accepts string and regexp matchers in persisted endpoints", () => {
    expect(() => webSocketEndpointsSchema.parse([
      {
        info: {
          id: "endpoint:string",
          kind: "websocket",
          endpoint: "ws://schema.test/string",
          operation: "endpoint",
          source: "temp",
        },
        endpointId: "endpoint:string",
        matcher: { kind: "string", value: "ws://schema.test/string" },
        enabled: true,
        listeners: [],
      },
      {
        info: {
          id: "endpoint:regexp",
          kind: "websocket",
          endpoint: "ws://schema.test/regexp",
          operation: "endpoint",
          source: "temp",
        },
        endpointId: "endpoint:regexp",
        matcher: { kind: "regexp", source: "schema\\.test/regexp", flags: "i" },
        enabled: false,
        listeners: [],
      },
    ])).not.toThrow();

    expect(serializableWebSocketMatcherSchema.parse({
      kind: "regexp",
      source: "schema\\.test/regexp",
      flags: "gi",
    })).toEqual({
      kind: "regexp",
      source: "schema\\.test/regexp",
      flags: "gi",
    });
  });

  it("rejects invalid matchers and behavior options", () => {
    expect(() => serializableWebSocketMatcherSchema.parse({
      kind: "regexp",
      source: "schema.test",
      flags: "invalid",
    })).toThrow("WebSocket regular-expression matcher must be valid");

    expect(() => webSocketBehaviorSchema.parse({
      preset: "reply",
    })).toThrow();
    expect(() => webSocketBehaviorSchema.parse({ preset: "send" })).toThrow();
    expect(() => webSocketBehaviorSchema.parse({
      preset: "close",
      options: { code: "4000" },
    })).toThrow();
  });

  it("accepts only WebSocket-compatible close arguments", () => {
    for (const code of [1000, 3000, 4999]) {
      expect(() => webSocketBehaviorSchema.parse({ preset: "close", options: { code } })).not.toThrow();
    }
    for (const code of [999, 1001, 2999, 5000]) {
      expect(() => webSocketBehaviorSchema.parse({ preset: "close", options: { code } }))
        .toThrow("WebSocket close code must be 1000 or between 3000 and 4999");
    }

    expect(() => webSocketBehaviorSchema.parse({
      preset: "close",
      options: { reason: "€".repeat(41) },
    })).not.toThrow();
    expect(() => webSocketBehaviorSchema.parse({
      preset: "close",
      options: { reason: "€".repeat(41) + "a" },
    })).toThrow("WebSocket close reason must not exceed 123 UTF-8 bytes");
  });

  it("accepts the built-in response presets", () => {
    for (const behavior of [
      { preset: "echo" },
      { preset: "send-null" },
      { preset: "no-reply" },
      { preset: "send-sequence" },
    ]) {
      expect(() => webSocketBehaviorSchema.parse(behavior)).not.toThrow();
    }
    for (const code of [1000, 4000, 4001, 4008]) {
      expect(() => webSocketBehaviorSchema.parse({ preset: "close", options: { code } })).not.toThrow();
    }
  });

  it("validates custom WebSocket responses", () => {
    expect(() => webSocketBehaviorSchema.parse({ preset: "custom response" })).not.toThrow();
    expect(() => webSocketCustomResponseSchema.parse({ type: "send", dataType: "string", value: "hello" })).not.toThrow();
    expect(() => webSocketCustomResponseSchema.parse({ type: "send", dataType: "Blob", value: "68 69", metadata: { type: "text/plain" } })).not.toThrow();
    expect(() => webSocketCustomResponseSchema.parse({ type: "send", dataType: "ArrayBuffer", value: "68 69" })).not.toThrow();
    expect(() => webSocketCustomResponseSchema.parse({ type: "close", code: 4001, reason: "Unauthorized" })).not.toThrow();
    expect(() => webSocketCustomResponseSchema.parse({ type: "send", dataType: "Blob", value: "6g" })).toThrow();
    expect(webSocketResponseSchema.parse({ type: "close", code: 1000 })).toEqual({ type: "close", code: 1000 });
    expect(webSocketCustomResponseSchema.parse({ type: "send", dataType: "string", value: "hello" })).toEqual(
      webSocketResponseSchema.parse({ type: "send", dataType: "string", value: "hello" }),
    );
  });

  it("validates listener scheduling and defaults old listeners", () => {
    expect(webSocketRepeatSchema.parse({ interval: 500, repetitions: "Infinity" })).toEqual({ interval: 500, repetitions: "Infinity" });
    expect(() => webSocketRepeatSchema.parse({ interval: -1, repetitions: 1 })).toThrow();
    expect(() => webSocketRepeatSchema.parse({ interval: 1, repetitions: 0 })).toThrow();
    const listener = webSocketListenerSchema.parse({
      info: { id: "listener", kind: "websocket", endpoint: "ws://test", operation: "message", source: "temp" },
      endpointId: "endpoint",
      event: "message",
      enabled: true,
    });
    expect(listener).toMatchObject({ behavior: { preset: "default" }, delay: 0 });
  });
});
