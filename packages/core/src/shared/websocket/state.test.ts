import { describe, expect, it } from "vitest";
import {
  addTemporaryWebSocketEndpoint,
  addTemporaryWebSocketListener,
  setWebSocketListenerBehavior,
  setWebSocketListenerCustomResponse,
  setWebSocketListenerResponse,
} from "./state";
import type { WebSocketEndpointConfig } from "../types";

const endpoint = (value = "ws://state.test/chat"): WebSocketEndpointConfig =>
  addTemporaryWebSocketEndpoint([], {
    kind: "string",
    value,
  }).endpoint;

describe("temporary WebSocket listener state", () => {
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
