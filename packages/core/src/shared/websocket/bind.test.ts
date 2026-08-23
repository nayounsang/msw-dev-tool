import { describe, expect, it, vi } from "vitest";
import type { WebSocketStoreAdapter } from "./bind";
import { attachWebSocketHandlerBindHook, bindWebSocketHandler } from "./bind";

const createAdapter = (): WebSocketStoreAdapter => ({
  registerCodeWebSocketEndpoint: vi.fn(),
  registerCodeWebSocketListener: vi.fn(),
  getWebSocketEndpoint: vi.fn(),
  getWebSocketListener: vi.fn(),
  registerWebSocketConnection: vi.fn(),
  unregisterWebSocketConnection: vi.fn(),
  registerWebSocketMessageListener: vi.fn(),
  unregisterWebSocketMessageListener: vi.fn(),
  connectWebSocket: vi.fn(),
  dispatchWebSocketMessage: vi.fn(),
  closeWebSocketConnections: vi.fn(),
  resetWebSocketConnections: vi.fn(),
});

describe("WebSocket handler binding", () => {
  it("rejects invalid handlers and binds valid hooks", () => {
    const adapter = createAdapter();

    expect(bindWebSocketHandler(null, adapter)).toBe(false);
    expect(bindWebSocketHandler({}, adapter)).toBe(false);
    expect(bindWebSocketHandler(() => undefined, adapter)).toBe(false);

    const handler = {};
    const hook = attachWebSocketHandlerBindHook(handler);

    expect(bindWebSocketHandler(handler, adapter)).toBe(true);
    expect(hook.getAdapter()).toBe(adapter);
  });
});
