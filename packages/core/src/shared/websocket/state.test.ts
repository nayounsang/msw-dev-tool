import { describe, expect, it } from "vitest";
import {
  addTemporaryWebSocketEndpoint,
  addTemporaryWebSocketListener,
  setWebSocketListenerBehavior,
  setWebSocketListenerCustomResponse,
  setWebSocketListenerResponse,
  setWebSocketListenerSchedule,
} from "./state";
import type { WebSocketEndpointConfig } from "../types";

const endpoint = (): WebSocketEndpointConfig => addTemporaryWebSocketEndpoint([], {
  kind: "string",
  value: "ws://state.test/chat",
}).endpoint;

describe("temporary WebSocket listener state", () => {
  it("defaults temporary listeners to default behavior and delay zero", () => {
    const created = addTemporaryWebSocketListener([endpoint()], endpoint().endpointId, {});
    expect(created.listener).toMatchObject({ behavior: { preset: "default" }, delay: 0 });
  });

  it("keeps response and customResponse independent while changing behavior", () => {
    const initial = endpoint();
    const added = addTemporaryWebSocketListener([initial], initial.endpointId, {
      response: { type: "send", dataType: "string", value: "default" },
      customResponse: { type: "send", dataType: "string", value: "custom" },
    });
    const withResponse = setWebSocketListenerResponse(added.endpoints, added.listener.info.id, {
      type: "send", dataType: "string", value: "updated default",
    });
    const withCustom = setWebSocketListenerCustomResponse(withResponse.endpoints, added.listener.info.id, {
      type: "send", dataType: "string", value: "updated custom",
    });
    const changed = setWebSocketListenerBehavior(withCustom.endpoints, added.listener.info.id, { preset: "custom response" });
    expect(changed.listener).toMatchObject({
      behavior: { preset: "custom response" },
      response: { value: "updated default" },
      customResponse: { value: "updated custom" },
    });
  });

  it("supports partial schedule changes and removes repeat explicitly", () => {
    const initial = endpoint();
    const added = addTemporaryWebSocketListener([initial], initial.endpointId, {
      delay: 300,
      repeat: { interval: 500, repetitions: "Infinity" },
    });
    const changed = setWebSocketListenerSchedule(added.endpoints, added.listener.info.id, { repeat: undefined });
    expect(changed.listener).toMatchObject({ delay: 300 });
    expect(changed.listener.repeat).toBeUndefined();
    const rescheduled = setWebSocketListenerSchedule(changed.endpoints, added.listener.info.id, {
      delay: 100,
      repeat: { interval: 50, repetitions: 3 },
    });
    expect(rescheduled.listener).toMatchObject({ delay: 100, repeat: { interval: 50, repetitions: 3 } });
  });
});
