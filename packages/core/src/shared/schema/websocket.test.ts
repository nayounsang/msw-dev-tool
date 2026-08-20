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
});
