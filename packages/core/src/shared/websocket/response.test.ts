import { describe, expect, it } from "vitest";
import {
  getWebSocketControlledResponse,
  parseWebSocketHex,
  renderWebSocketResponse,
  toWebSocketSendData,
} from "./response";
import { createWebSocketTemplateContext } from "./interpolation";

const messageEvent = (data: unknown): MessageEvent => new MessageEvent("message", { data });

describe("WebSocket custom response payloads", () => {
  it("parses JSON message data for nested event template paths", () => {
    expect(createWebSocketTemplateContext(messageEvent('{"userId":"user-7"}'))).toEqual({
      event: { data: { userId: "user-7" } },
    });
  });

  it("keeps plain text message data as text in the template context", () => {
    expect(createWebSocketTemplateContext(messageEvent("plain message"))).toEqual({
      event: { data: "plain message" },
    });
  });

  it("keeps malformed JSON message data as text in the template context", () => {
    expect(createWebSocketTemplateContext(messageEvent("{malformed"))).toEqual({
      event: { data: "{malformed" },
    });
  });

  it("keeps JSON primitive message data as text in the template context", () => {
    expect(createWebSocketTemplateContext(messageEvent("42"))).toEqual({
      event: { data: "42" },
    });
  });

  it("keeps binary message data in the template context", () => {
    const data = new ArrayBuffer(1);
    expect(createWebSocketTemplateContext(messageEvent(data))).toEqual({
      event: { data },
    });
  });

  it("renders a text response from the incoming event data", () => {
    const response = renderWebSocketResponse(
      { type: "send", dataType: "string", value: "user=${{event.data.userId}}" },
      messageEvent({ userId: "user-7" }),
    );

    expect(response).toEqual({
      type: "send",
      dataType: "string",
      value: "user=user-7",
    });
  });

  it("interpolates JSON-looking strings without parsing or normalizing them", () => {
    const response = renderWebSocketResponse(
      {
        type: "send",
        dataType: "string",
        value: ' {  "id": "${{event.data.userId}}", "duplicate": 1, "duplicate": 2 } ',
      },
      messageEvent({ userId: "user-7" }),
    );

    expect(response.value).toBe(' {  "id": "user-7", "duplicate": 1, "duplicate": 2 } ');
  });

  it("keeps an unresolved event token in the response text", () => {
    const unresolved = renderWebSocketResponse(
      { type: "send", dataType: "string", value: "${{event.data.missing}}" },
      messageEvent({ userId: "user-7" }),
    );

    expect(unresolved.value).toBe("${{event.data.missing}}");
  });

  it("keeps malformed JSON response text available to the client", () => {
    const malformed = renderWebSocketResponse(
      { type: "send", dataType: "string", value: '{"id":${{event.data.userId}}' },
      messageEvent({ userId: "user-7" }),
    );

    expect(malformed.value).toBe('{"id":user-7');
  });

  it("leaves a binary response unchanged when an event is available", () => {
    const binary = {
      type: "send" as const,
      dataType: "ArrayBuffer" as const,
      value: "68 69",
    };

    expect(renderWebSocketResponse(binary, messageEvent({ value: "ignored" }))).toBe(binary);
  });

  it("leaves a close response unchanged when an event is available", () => {
    const close = { type: "close" as const, code: 4001, reason: "${{event.data}}" };

    expect(renderWebSocketResponse(close, messageEvent({ value: "ignored" }))).toBe(close);
  });

  it("leaves a static string response unchanged", () => {
    expect(
      renderWebSocketResponse(
        { type: "send", dataType: "string", value: "static" },
        messageEvent({ value: "ignored" }),
      ),
    ).toEqual({ type: "send", dataType: "string", value: "static" });
  });

  it("leaves a templated response unchanged when no event is provided", () => {
    expect(
      renderWebSocketResponse({ type: "send", dataType: "string", value: "${{event.data}}" }),
    ).toEqual({ type: "send", dataType: "string", value: "${{event.data}}" });
  });

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
