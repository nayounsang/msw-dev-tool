import { describe, expect, it } from "vitest";
import {
  serializableWebSocketMatcherSchema,
  webSocketBehaviorSchema,
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
});
