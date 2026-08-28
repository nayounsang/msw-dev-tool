import { describe, expect, it } from "vitest";
import {
  addTemporaryWebSocketEndpoint,
  addTemporaryWebSocketListener,
  setWebSocketListenerBehavior,
  setWebSocketListenerCustomResponse,
  setWebSocketListenerResponse,
  mergeDiscoveredWebSocketState,
  resetWebSocketEndpoints,
} from "./state";
import type { WebSocketEndpointConfig } from "../types";

const endpoint = (value = "ws://state.test/chat"): WebSocketEndpointConfig =>
  addTemporaryWebSocketEndpoint([], {
    kind: "string",
    value,
  }).endpoint;

describe("temporary WebSocket listener state", () => {
  it("resets code endpoint, listener, and event-branch enable settings", () => {
    const reset = resetWebSocketEndpoints([
      {
        info: {
          id: "code-endpoint",
          kind: "websocket",
          endpoint: "ws://state.test/code",
          operation: "endpoint",
          source: "code",
        },
        endpointId: "code-endpoint",
        matcher: { kind: "string", value: "ws://state.test/code" },
        enabled: false,
        listeners: [
          {
            info: {
              id: "code-listener",
              kind: "websocket",
              endpoint: "ws://state.test/code",
              operation: "message",
              source: "code",
            },
            endpointId: "code-endpoint",
            event: "message",
            enabled: false,
            behavior: { preset: "echo" },
            eventBranches: [
              { eventType: "chat/join", enabled: false, behavior: { preset: "no-reply" } },
            ],
          },
        ],
      },
    ]);

    expect(reset).toMatchObject([
      { enabled: true, listeners: [{ enabled: true, eventBranches: [{ enabled: true }] }] },
    ]);
  });

  it("merges code discovery without replacing saved controls or temporary state", () => {
    const codeInfo = {
      id: "code-endpoint",
      kind: "websocket" as const,
      endpoint: "ws://state.test/code",
      operation: "endpoint",
      source: "code" as const,
    };
    const listenerInfo = { ...codeInfo, id: "code-listener", operation: "message" };
    const saved: WebSocketEndpointConfig = {
      info: codeInfo,
      endpointId: codeInfo.id,
      matcher: { kind: "string", value: codeInfo.endpoint },
      enabled: false,
      listeners: [
        {
          info: listenerInfo,
          endpointId: codeInfo.id,
          event: "message",
          enabled: false,
          behavior: { preset: "default" },
          eventBranches: [
            { eventType: "chat/message", enabled: false, behavior: { preset: "echo" } },
          ],
        },
        {
          info: { ...listenerInfo, id: "temp-listener", source: "temp" },
          endpointId: codeInfo.id,
          event: "message",
          enabled: true,
          behavior: { preset: "default" },
        },
      ],
    };
    const temporary = endpoint("ws://state.test/temp");
    const declaration: WebSocketEndpointConfig = {
      ...saved,
      info: { ...codeInfo, endpoint: "ws://state.test/current-code" },
      matcher: { kind: "regexp", source: "current-code$", flags: "i" },
      enabled: true,
      listeners: [
        {
          ...saved.listeners[0]!,
          enabled: true,
          eventBranches: [
            { eventType: "chat/message", enabled: true, behavior: { preset: "default" } },
            { eventType: "chat/leave", enabled: true, behavior: { preset: "default" } },
          ],
        },
        {
          info: { ...listenerInfo, id: "new-code-listener" },
          endpointId: codeInfo.id,
          event: "message",
          enabled: true,
          behavior: { preset: "default" },
        },
        saved.listeners[1]!,
      ],
    };
    const newCodeEndpoint: WebSocketEndpointConfig = {
      info: { ...codeInfo, id: "new-code-endpoint" },
      endpointId: "new-code-endpoint",
      matcher: { kind: "string", value: "ws://state.test/new-code" },
      enabled: true,
      listeners: [],
    };

    const merged = mergeDiscoveredWebSocketState(
      [saved, temporary],
      [declaration, newCodeEndpoint, temporary],
    );

    expect(merged).toHaveLength(3);
    expect(merged[0]).toMatchObject({
      info: { endpoint: "ws://state.test/current-code" },
      matcher: { kind: "regexp", source: "current-code$", flags: "i" },
      enabled: false,
      listeners: [
        {
          info: { id: "code-listener" },
          enabled: true,
          eventBranches: [
            { eventType: "chat/message", enabled: false, behavior: { preset: "echo" } },
            { eventType: "chat/leave", enabled: true, behavior: { preset: "default" } },
          ],
        },
        { info: { id: "temp-listener" } },
        { info: { id: "new-code-listener" } },
      ],
    });
    expect(merged[1]).toBe(temporary);
    expect(merged[2]).toBe(newCodeEndpoint);
    expect(mergeDiscoveredWebSocketState(merged, merged)).toBe(merged);
  });

  it("defaults temporary listeners to default behavior", () => {
    const created = addTemporaryWebSocketListener([endpoint()], endpoint().endpointId, {});
    expect(created.listener).toMatchObject({ behavior: { preset: "default" } });
  });

  it("keeps response and customResponse independent while changing behavior", () => {
    const initial = endpoint();
    const added = addTemporaryWebSocketListener([initial], initial.endpointId, {
      response: { type: "send", dataType: "string", value: "default" },
      customResponse: { type: "send", dataType: "string", value: "custom" },
    });
    const withSibling = addTemporaryWebSocketListener(added.endpoints, initial.endpointId, {
      behavior: { preset: "echo" },
    });
    const withResponse = setWebSocketListenerResponse(
      withSibling.endpoints,
      added.listener.info.id,
      {
        type: "send",
        dataType: "string",
        value: "updated default",
      },
    );
    const withCustom = setWebSocketListenerCustomResponse(
      withResponse.endpoints,
      added.listener.info.id,
      {
        type: "send",
        dataType: "string",
        value: "updated custom",
      },
    );
    const changed = setWebSocketListenerBehavior(withCustom.endpoints, added.listener.info.id, {
      preset: "custom response",
    });
    expect(changed.listener).toMatchObject({
      behavior: { preset: "custom response" },
      response: { value: "updated default" },
      customResponse: { value: "updated custom" },
    });
    expect(changed.endpoint.listeners[1]).toMatchObject({
      info: { id: withSibling.listener.info.id },
      behavior: { preset: "echo" },
    });
  });

  it("stores independent schedules with the default and custom responses", () => {
    const initial = endpoint();
    const added = addTemporaryWebSocketListener([initial], initial.endpointId, {
      response: {
        type: "send",
        dataType: "string",
        value: "default",
        delay: 300,
        repeat: { interval: 500, repetitions: "Infinity" },
      },
      customResponse: {
        type: "send",
        dataType: "string",
        value: "custom",
        delay: 100,
        repeat: { interval: 50, repetitions: 3 },
      },
    });
    expect(added.listener).toMatchObject({
      response: { delay: 300, repeat: { interval: 500, repetitions: "Infinity" } },
      customResponse: { delay: 100, repeat: { interval: 50, repetitions: 3 } },
    });
  });
});
