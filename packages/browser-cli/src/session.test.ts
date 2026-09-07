import { describe, expect, it, vi } from "vitest";
import { CdpClient } from "./cdp";
import { CdpBrowserCliSession } from "./session";

const CONTROL_KEY = "__MSW_DEV_TOOL_CONTROL__";

const createEvaluatingClient = (bridge: Record<string, unknown>) => {
  const call = vi.fn(async (_method: string, parameters: { expression: string }) => {
    const root = globalThis as Record<string, unknown>;
    const previousBridge = root[CONTROL_KEY];
    root[CONTROL_KEY] = bridge;
    try {
      return { result: { value: (0, eval)(parameters.expression) } };
    } catch (error) {
      return {
        exceptionDetails: {
          exception: { description: `${error as Error}\n    at eval` },
        },
      };
    } finally {
      if (previousBridge === undefined) delete root[CONTROL_KEY];
      else root[CONTROL_KEY] = previousBridge;
    }
  });
  return { call, client: { call } as unknown as CdpClient };
};

const createWebSocketBridge = () => {
  const listWebSocket = vi.fn(() => []);
  const getWebSocketEndpoint = vi.fn(() => undefined);
  const addWebSocketEndpoint = vi.fn(() => ({ endpoint: { endpointId: "endpoint-a" } }));
  const removeWebSocketEndpoint = vi.fn(() => ({ endpoints: [] }));
  const setWebSocketEndpointEnabled = vi.fn(() => ({ endpoint: { endpointId: "endpoint-a" } }));
  const addWebSocketListener = vi.fn(() => ({
    endpoint: { endpointId: "endpoint-a" },
    listener: { info: { id: "listener-a" } },
  }));
  const removeWebSocketListener = vi.fn(() => ({ endpoints: [] }));
  const setWebSocketListenerEnabled = vi.fn(() => ({
    endpoint: { endpointId: "endpoint-a" },
    listener: { info: { id: "listener-a" } },
  }));
  const setWebSocketListenerEventEnabled = vi.fn(() => ({
    endpoint: { endpointId: "endpoint-a" },
    listener: { info: { id: "listener-a" } },
    eventBranch: { eventType: "chat/message" },
  }));
  const setWebSocketListenerBehavior = vi.fn(() => ({
    endpoint: { endpointId: "endpoint-a" },
    listener: { info: { id: "listener-a" } },
  }));
  const setWebSocketListenerResponse = vi.fn(() => ({
    endpoint: { endpointId: "endpoint-a" },
    listener: { info: { id: "listener-a" } },
  }));
  const setWebSocketListenerEventBehavior = vi.fn(() => ({
    endpoint: { endpointId: "endpoint-a" },
    listener: { info: { id: "listener-a" } },
    eventBranch: { eventType: "chat/message" },
  }));
  const setWebSocketListenerEventCustomResponse = vi.fn(() => ({
    endpoint: { endpointId: "endpoint-a" },
    listener: { info: { id: "listener-a" } },
    eventBranch: { eventType: "chat/message" },
  }));
  const setWebSocketListenerEventResponse = vi.fn(() => ({
    endpoint: { endpointId: "endpoint-a" },
    listener: { info: { id: "listener-a" } },
    eventBranch: { eventType: "chat/message" },
  }));
  const bridge = {
    methods: {
      listWebSocket: 1,
      getWebSocketEndpoint: 1,
      addWebSocketEndpoint: 1,
      removeWebSocketEndpoint: 1,
      setWebSocketEndpointEnabled: 1,
      addWebSocketListener: 1,
      removeWebSocketListener: 1,
      setWebSocketListenerEnabled: 1,
      setWebSocketListenerEventEnabled: 1,
      setWebSocketListenerBehavior: 1,
      setWebSocketListenerResponse: 2,
      setWebSocketListenerEventBehavior: 1,
      setWebSocketListenerEventCustomResponse: 1,
      setWebSocketListenerEventResponse: 1,
    },
    listWebSocket,
    getWebSocketEndpoint,
    addWebSocketEndpoint,
    removeWebSocketEndpoint,
    setWebSocketEndpointEnabled,
    addWebSocketListener,
    removeWebSocketListener,
    setWebSocketListenerEnabled,
    setWebSocketListenerEventEnabled,
    setWebSocketListenerBehavior,
    setWebSocketListenerResponse,
    setWebSocketListenerEventBehavior,
    setWebSocketListenerEventCustomResponse,
    setWebSocketListenerEventResponse,
  };

  return { ...createEvaluatingClient(bridge), ...bridge };
};

describe("CdpBrowserCliSession", () => {
  it("returns the serialized result after a user changes a handler behavior", async () => {
    const call = vi.fn().mockResolvedValue({ result: { value: { revision: 2, handlerCount: 1 } } });
    const client = { call } as unknown as CdpClient;
    const session = new CdpBrowserCliSession(client);

    await expect(session.setBehavior("handler-a", "delay")).resolves.toEqual({
      revision: 2,
      handlerCount: 1,
    });
  });

  it("requests the required browser-control capability before changing a handler behavior", async () => {
    const call = vi.fn().mockResolvedValue({ result: { value: { revision: 2, handlerCount: 1 } } });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);

    await session.setBehavior("handler-a", "delay");

    expect(call).toHaveBeenCalledWith(
      "Runtime.evaluate",
      expect.objectContaining({
        awaitPromise: true,
        returnByValue: true,
        expression: expect.stringContaining("__MSW_DEV_TOOL_CONTROL__"),
      }),
    );
  });

  it("checks the set-behavior capability revision before invoking the page control", async () => {
    const call = vi.fn().mockResolvedValue({ result: { value: { revision: 2, handlerCount: 1 } } });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);

    await session.setBehavior("handler-a", "delay");

    expect(call).toHaveBeenCalledWith(
      "Runtime.evaluate",
      expect.objectContaining({
        expression: expect.stringContaining('bridge.methods?.["setBehavior"] !== 1'),
      }),
    );
  });

  it("does not depend on the legacy bridge version when changing a handler behavior", async () => {
    const call = vi.fn().mockResolvedValue({ result: { value: { revision: 2, handlerCount: 1 } } });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);

    await session.setBehavior("handler-a", "delay");

    expect(call.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        expression: expect.not.stringContaining("bridge.version"),
      }),
    );
  });

  it("sends custom response configuration through the page control bridge", async () => {
    const call = vi.fn().mockResolvedValue({ result: { value: { revision: 3, handlerCount: 1 } } });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);

    await expect(
      session.setCustomResponse("handler-a", {
        status: "201",
        contentType: "text/plain",
        response: "created",
      }),
    ).resolves.toEqual({ revision: 3, handlerCount: 1 });
    expect(call).toHaveBeenCalledWith(
      "Runtime.evaluate",
      expect.objectContaining({
        expression: expect.stringContaining('"setCustomResponse"'),
      }),
    );
  });

  it("sends a handler enabled-state change through the page control bridge", async () => {
    const call = vi.fn().mockResolvedValue({
      result: { value: { revision: 3, handlerCount: 1, mockEnabled: false } },
    });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);

    await session.setEnabled("handler-a", false);

    expect(call.mock.calls[0]?.[1].expression).toContain(
      'bridge["setEnabled"](...["handler-a",false])',
    );
  });

  it("sends a global mock enabled-state change through the page control bridge", async () => {
    const call = vi.fn().mockResolvedValue({
      result: { value: { revision: 3, handlerCount: 1, mockEnabled: false } },
    });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);

    await session.setMockEnabled(false);

    expect(call.mock.calls[0]?.[1].expression).toContain('bridge["setMockEnabled"](...[false])');
  });

  it.each(["setEnabled", "setMockEnabled"] as const)(
    "rejects %s before invocation when its capability is unavailable",
    async (method) => {
      const invoke = vi.fn();
      const { client } = createEvaluatingClient({ methods: { [method]: 99 }, [method]: invoke });
      const session = new CdpBrowserCliSession(client);

      await expect(
        method === "setEnabled"
          ? session.setEnabled("handler-a", false)
          : session.setMockEnabled(false),
      ).rejects.toThrow(
        `MSW Dev Tool browser control method "${method}" version 1 is unavailable. Update @msw-dev-tool/core.`,
      );
      expect(invoke).not.toHaveBeenCalled();
    },
  );

  it("sends WebSocket custom response configuration through the page control bridge", async () => {
    const call = vi.fn().mockResolvedValue({ result: { value: { endpoint: {}, listener: {} } } });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);

    await expect(
      session.setWebSocketListenerCustomResponse("listener-a", {
        type: "send",
        dataType: "Blob",
        value: "68 69",
        metadata: { type: "text/plain" },
      }),
    ).resolves.toEqual({ endpoint: {}, listener: {} });
    expect(call).toHaveBeenCalledWith(
      "Runtime.evaluate",
      expect.objectContaining({
        expression: expect.stringContaining('"setWebSocketListenerCustomResponse"'),
      }),
    );
  });

  it("returns the Chrome bridge error description to the CLI caller", async () => {
    const client = {
      call: vi.fn().mockResolvedValue({
        exceptionDetails: {
          exception: { description: "Error: bridge unavailable\n    at internal webpack frame" },
        },
      }),
    } as unknown as CdpClient;
    await expect(new CdpBrowserCliSession(client).list()).rejects.toThrow(
      "Error: bridge unavailable",
    );
  });

  it("omits Chrome stack frames from a bridge error returned to the CLI caller", async () => {
    const client = {
      call: vi.fn().mockResolvedValue({
        exceptionDetails: {
          exception: { description: "Error: bridge unavailable\n    at internal webpack frame" },
        },
      }),
    } as unknown as CdpClient;

    await expect(new CdpBrowserCliSession(client).list()).rejects.not.toThrow("webpack");
  });

  it.each([
    ["the capability manifest is missing", {}, true],
    ["the method version is incompatible", { methods: { setCustomResponse: 1 } }, true],
    ["the method implementation is missing", { methods: { setCustomResponse: 2 } }, false],
  ])("rejects before invocation when %s", async (_scenario, bridge, includeImplementation) => {
    const setCustomResponse = vi.fn();
    const { client } = createEvaluatingClient({
      ...bridge,
      ...(includeImplementation ? { setCustomResponse } : {}),
    });

    await expect(
      new CdpBrowserCliSession(client).setCustomResponse("handler-a", {}),
    ).rejects.toThrow(
      'MSW Dev Tool browser control method "setCustomResponse" version 2 is unavailable. Update @msw-dev-tool/core.',
    );
    expect(setCustomResponse).not.toHaveBeenCalled();
  });

  it("ignores capability versions for unrelated methods", async () => {
    const setBehavior = vi.fn().mockReturnValue({ revision: 4, handlerCount: 1 });
    const { client } = createEvaluatingClient({
      methods: { list: 99, setBehavior: 1 },
      setBehavior,
    });

    await expect(
      new CdpBrowserCliSession(client).setBehavior("handler-a", "delay"),
    ).resolves.toEqual({
      revision: 4,
      handlerCount: 1,
    });
    expect(setBehavior).toHaveBeenCalledWith("handler-a", "delay");
  });

  it("forwards every bridge operation and accepts an empty remote value", async () => {
    const call = vi.fn().mockResolvedValue({ result: {} });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);
    await session.describe();
    await session.list();
    await session.get("a");
    await session.addTemp({
      path: "/tmp",
      method: "get",
      contentType: "text/plain",
      status: "200",
    });
    await session.removeTemp("a");
    await session.reset();
    expect(call).toHaveBeenCalledTimes(6);
  });

  it("uses the CDP text field when no exception description is present", async () => {
    const client = {
      call: vi.fn().mockResolvedValue({ exceptionDetails: { text: "evaluation failed" } }),
    } as unknown as CdpClient;
    await expect(new CdpBrowserCliSession(client).describe()).rejects.toThrow("evaluation failed");
  });

  it("falls back to the generic evaluation error when Chrome provides no message", async () => {
    const client = {
      call: vi.fn().mockResolvedValue({ exceptionDetails: { text: "" } }),
    } as unknown as CdpClient;
    await expect(new CdpBrowserCliSession(client).describe()).rejects.toThrow(
      "CDP evaluation failed",
    );
  });

  it("returns the WebSocket endpoints available to the CLI caller", async () => {
    const { client } = createWebSocketBridge();

    await expect(new CdpBrowserCliSession(client).listWebSocket()).resolves.toEqual([]);
  });

  it("returns no endpoint when the requested WebSocket endpoint is absent", async () => {
    const { client } = createWebSocketBridge();

    await expect(
      new CdpBrowserCliSession(client).getWebSocketEndpoint("endpoint-a"),
    ).resolves.toBeUndefined();
  });

  it("passes a WebSocket endpoint matcher to the page control bridge", async () => {
    const { client, addWebSocketEndpoint } = createWebSocketBridge();
    const matcher = { kind: "regexp" as const, source: "browser\\.example", flags: "i" };

    await new CdpBrowserCliSession(client).addWebSocketEndpoint(matcher);

    expect(addWebSocketEndpoint).toHaveBeenCalledWith(matcher);
  });

  it("passes a WebSocket endpoint ID when removing a temporary endpoint", async () => {
    const { client, removeWebSocketEndpoint } = createWebSocketBridge();

    await new CdpBrowserCliSession(client).removeWebSocketEndpoint("endpoint-a");

    expect(removeWebSocketEndpoint).toHaveBeenCalledWith("endpoint-a");
  });

  it("passes a WebSocket endpoint enabled state to the page control bridge", async () => {
    const { client, setWebSocketEndpointEnabled } = createWebSocketBridge();

    await new CdpBrowserCliSession(client).setWebSocketEndpointEnabled("endpoint-a", false);

    expect(setWebSocketEndpointEnabled).toHaveBeenCalledWith("endpoint-a", false);
  });

  it("passes an endpoint ID and behavior when adding a WebSocket listener", async () => {
    const { client, addWebSocketListener } = createWebSocketBridge();
    const behavior = { preset: "send", options: { message: "hello" } } as const;

    await new CdpBrowserCliSession(client).addWebSocketListener("endpoint-a", behavior);

    expect(addWebSocketListener).toHaveBeenCalledWith("endpoint-a", behavior);
  });

  it("passes a temporary listener input without losing response schedule fields", async () => {
    const { client, addWebSocketListener } = createWebSocketBridge();
    const input = {
      endpointId: "endpoint-a",
      behavior: { preset: "default" as const },
      response: {
        type: "send" as const,
        dataType: "string" as const,
        value: "default",
        delay: 300,
        repeat: { interval: 500, repetitions: 3 },
      },
      customResponse: {
        type: "send" as const,
        dataType: "string" as const,
        value: "custom",
        delay: 100,
      },
    };

    await new CdpBrowserCliSession(client).addWebSocketListener(input);

    expect(addWebSocketListener).toHaveBeenCalledWith(input);
  });

  it("passes a listener ID when removing a WebSocket listener", async () => {
    const { client, removeWebSocketListener } = createWebSocketBridge();

    await new CdpBrowserCliSession(client).removeWebSocketListener("listener-a");

    expect(removeWebSocketListener).toHaveBeenCalledWith("listener-a");
  });

  it("passes a listener enabled state to the page control bridge", async () => {
    const { client, setWebSocketListenerEnabled } = createWebSocketBridge();

    await new CdpBrowserCliSession(client).setWebSocketListenerEnabled("listener-a", false);

    expect(setWebSocketListenerEnabled).toHaveBeenCalledWith("listener-a", false);
  });

  it("passes an event branch enabled state to the page control bridge", async () => {
    const { client, setWebSocketListenerEventEnabled } = createWebSocketBridge();

    await new CdpBrowserCliSession(client).setWebSocketListenerEventEnabled(
      "listener-a",
      "chat/message",
      false,
    );

    expect(setWebSocketListenerEventEnabled).toHaveBeenCalledWith(
      "listener-a",
      "chat/message",
      false,
    );
  });

  it("passes a listener behavior to the page control bridge", async () => {
    const { client, setWebSocketListenerBehavior } = createWebSocketBridge();
    const behavior = { preset: "close" as const, options: { code: 4001, reason: "done" } };

    await new CdpBrowserCliSession(client).setWebSocketListenerBehavior("listener-a", behavior);

    expect(setWebSocketListenerBehavior).toHaveBeenCalledWith("listener-a", behavior);
  });

  it("passes a listener response schedule to the page control bridge", async () => {
    const { client, setWebSocketListenerResponse } = createWebSocketBridge();
    const response = {
      type: "send" as const,
      dataType: "string" as const,
      value: "default",
      delay: 300,
      repeat: { interval: 500, repetitions: "Infinity" as const },
    };

    await new CdpBrowserCliSession(client).setWebSocketListenerResponse("listener-a", response);

    expect(setWebSocketListenerResponse).toHaveBeenCalledWith("listener-a", response);
  });

  it("passes an event branch behavior to the page control bridge", async () => {
    const { client, setWebSocketListenerEventBehavior } = createWebSocketBridge();
    const behavior = { preset: "echo" as const };

    await new CdpBrowserCliSession(client).setWebSocketListenerEventBehavior(
      "listener-a",
      "chat/message",
      behavior,
    );

    expect(setWebSocketListenerEventBehavior).toHaveBeenCalledWith(
      "listener-a",
      "chat/message",
      behavior,
    );
  });

  it("passes an event branch custom response to the page control bridge", async () => {
    const { client, setWebSocketListenerEventCustomResponse } = createWebSocketBridge();
    const customResponse = { type: "send" as const, dataType: "string" as const, value: "custom" };

    await new CdpBrowserCliSession(client).setWebSocketListenerEventCustomResponse(
      "listener-a",
      "chat/message",
      customResponse,
    );

    expect(setWebSocketListenerEventCustomResponse).toHaveBeenCalledWith(
      "listener-a",
      "chat/message",
      customResponse,
    );
  });

  it("passes an event branch response to the page control bridge", async () => {
    const { client, setWebSocketListenerEventResponse } = createWebSocketBridge();
    const response = { type: "send" as const, dataType: "string" as const, value: "response" };

    await new CdpBrowserCliSession(client).setWebSocketListenerEventResponse(
      "listener-a",
      "chat/message",
      response,
    );

    expect(setWebSocketListenerEventResponse).toHaveBeenCalledWith(
      "listener-a",
      "chat/message",
      response,
    );
  });

  it.each([
    ["the capability manifest is missing", {}, true],
    [
      "the WebSocket method version is incompatible",
      { methods: { addWebSocketEndpoint: 2 } },
      true,
    ],
    [
      "the WebSocket method implementation is missing",
      { methods: { addWebSocketEndpoint: 1 } },
      false,
    ],
  ])("rejects WebSocket invocation when %s", async (_scenario, bridge, includeImplementation) => {
    const addWebSocketEndpoint = vi.fn();
    const { client } = createEvaluatingClient({
      ...bridge,
      ...(includeImplementation ? { addWebSocketEndpoint } : {}),
    });

    await expect(
      new CdpBrowserCliSession(client).addWebSocketEndpoint({
        kind: "string",
        value: "ws://localhost",
      }),
    ).rejects.toThrow(
      'MSW Dev Tool browser control method "addWebSocketEndpoint" version 1 is unavailable. Update @msw-dev-tool/core.',
    );
    expect(addWebSocketEndpoint).not.toHaveBeenCalled();
  });
});
