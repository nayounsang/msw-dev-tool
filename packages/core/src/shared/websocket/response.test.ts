import { describe, expect, it } from "vitest";
import { getWebSocketControlledResponse, parseWebSocketHex, toWebSocketSendData } from "./response";

describe("WebSocket custom response payloads", () => {
  it("parses case-insensitive hexadecimal bytes", () => {
    expect(Array.from(parseWebSocketHex("68 65 6C 6C 6F"))).toEqual([104, 101, 108, 108, 111]);
  });

  it("rejects malformed hexadecimal input", () => {
    expect(() => parseWebSocketHex("")).toThrow("Binary WebSocket response");
    expect(() => parseWebSocketHex("6 6g")).toThrow("Binary WebSocket response");
  });

  it("returns a string payload", () => {
    expect(toWebSocketSendData({ type: "send", dataType: "string", value: "hello" })).toBe("hello");
  });

  it("returns an ArrayBuffer payload", () => {
    const buffer = toWebSocketSendData({ type: "send", dataType: "ArrayBuffer", value: "68 69" });
    expect(Array.from(new Uint8Array(buffer as ArrayBuffer))).toEqual([104, 105]);
  });

  it("returns a Blob payload with metadata", async () => {
    const blob = toWebSocketSendData({
      type: "send",
      dataType: "Blob",
      value: "68 69",
      metadata: { type: "text/plain" },
    });
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe("text/plain");
    await expect((blob as Blob).text()).resolves.toBe("hi");
  });

  it("selects responses only from the active listener or event branch", () => {
    const listener = {
      info: {
        id: "listener",
        kind: "websocket" as const,
        endpoint: "ws://example.test",
        operation: "message",
        source: "code" as const,
      },
      endpointId: "endpoint",
      event: "message" as const,
      enabled: true,
      behavior: { preset: "default" as const },
      response: { type: "send" as const, dataType: "string" as const, value: "listener response" },
      customResponse: {
        type: "send" as const,
        dataType: "string" as const,
        value: "listener custom response",
      },
    };
    const branch = {
      eventType: "chat/message",
      enabled: true,
      behavior: { preset: "default" as const },
      response: { type: "send" as const, dataType: "string" as const, value: "branch response" },
    };

    expect(getWebSocketControlledResponse(listener, "response")).toEqual(listener.response);
    expect(getWebSocketControlledResponse(listener, "customResponse")).toEqual(
      listener.customResponse,
    );
    expect(getWebSocketControlledResponse(listener, "response", branch)).toEqual(branch.response);
    expect(getWebSocketControlledResponse(listener, "customResponse", branch)).toBeUndefined();
  });
});
