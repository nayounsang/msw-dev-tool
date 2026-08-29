import { describe, expect, it, vi } from "vitest";
import type { WebSocketEndpointConfig, WebSocketListenerConfig } from "@msw-dev-tool/core/shared";
import {
  CliHandler,
  CliSession,
  commandUsage,
  commands,
  findCommand,
  parseArgs,
  printJson,
} from "./index";

const handler: CliHandler = {
  id: "a",
  path: "/a",
  method: "get",
  behavior: "default",
  type: "default",
};

const wsEndpoint: WebSocketEndpointConfig = {
  info: {
    id: "ws:ep:1",
    kind: "websocket",
    endpoint: "ws://localhost/chat",
    operation: "endpoint",
    source: "temp",
  },
  endpointId: "ws:ep:1",
  matcher: { kind: "string", value: "ws://localhost/chat" },
  enabled: true,
  listeners: [],
};

const wsListener: WebSocketListenerConfig = {
  info: {
    id: "ws:ep:1:message:0",
    kind: "websocket",
    endpoint: "ws://localhost/chat",
    operation: "message",
    source: "temp",
  },
  endpointId: "ws:ep:1",
  event: "message",
  enabled: true,
  behavior: { preset: "send", options: { message: "hello" } },
};

const wsEndpointWithListener: WebSocketEndpointConfig = { ...wsEndpoint, listeners: [wsListener] };
const wsEventBranch = {
  eventType: "chat/message",
  enabled: true,
  behavior: { preset: "default" as const },
};
const wsEndpointWithEventBranch: WebSocketEndpointConfig = {
  ...wsEndpoint,
  listeners: [{ ...wsListener, eventBranches: [wsEventBranch] }],
};

const createSession = (): CliSession => {
  const handlers = [{ ...handler }];
  let revision = 0;
  let mockEnabled = true;
  const info = () => ({ revision, handlerCount: handlers.length, mockEnabled });
  return {
    describe: async () => info(),
    list: async () => handlers,
    get: async (id) => handlers.find((item) => item.id === id),
    setBehavior: async (id, behavior) => {
      const item = handlers.find((entry) => entry.id === id);
      if (!item) throw new Error(`Handler not found for id: ${id}`);
      item.behavior = behavior;
      revision += 1;
      return { ...info(), handler: item };
    },
    setEnabled: async (id, enabled) => {
      const item = handlers.find((entry) => entry.id === id);
      if (!item) throw new Error(`Handler not found for id: ${id}`);
      item.enabled = enabled;
      revision += 1;
      return { ...info(), handler: item };
    },
    setMockEnabled: async (enabled) => {
      mockEnabled = enabled;
      revision += 1;
      return info();
    },
    setCustomResponse: async (id, customResponse) => {
      const item = handlers.find((entry) => entry.id === id);
      if (!item) throw new Error(`Handler not found for id: ${id}`);
      item.customResponse = customResponse;
      revision += 1;
      return { ...info(), handler: item };
    },
    addTemp: async () => {
      throw new Error("not used");
    },
    removeTemp: async () => {
      throw new Error("not used");
    },
    reset: async () => info(),
    listWebSocket: async () => [wsEndpoint],
    getWebSocketEndpoint: async (id) => (id === wsEndpoint.endpointId ? wsEndpoint : undefined),
    addWebSocketEndpoint: async () => ({ endpoint: wsEndpoint }),
    removeWebSocketEndpoint: async () => ({ endpoints: [] }),
    setWebSocketEndpointEnabled: async () => ({ endpoint: wsEndpoint }),
    addWebSocketListener: async () => ({ endpoint: wsEndpointWithListener, listener: wsListener }),
    removeWebSocketListener: async () => ({ endpoints: [wsEndpoint] }),
    setWebSocketListenerEnabled: async () => ({
      endpoint: wsEndpointWithListener,
      listener: wsListener,
    }),
    setWebSocketListenerEventEnabled: async () => ({
      endpoint: wsEndpointWithEventBranch,
      listener: wsEndpointWithEventBranch.listeners[0]!,
      eventBranch: wsEventBranch,
    }),
    setWebSocketListenerBehavior: async () => ({
      endpoint: wsEndpointWithListener,
      listener: wsListener,
    }),
    setWebSocketListenerCustomResponse: async () => ({
      endpoint: wsEndpointWithListener,
      listener: {
        ...wsListener,
        customResponse: { type: "send", dataType: "string", value: "hello" },
      },
    }),
    setWebSocketListenerResponse: async () => ({
      endpoint: wsEndpointWithListener,
      listener: { ...wsListener, response: { type: "send", dataType: "string", value: "default" } },
    }),
    setWebSocketListenerEventBehavior: async () => ({
      endpoint: wsEndpointWithEventBranch,
      listener: wsEndpointWithEventBranch.listeners[0]!,
      eventBranch: wsEventBranch,
    }),
    setWebSocketListenerEventCustomResponse: async () => ({
      endpoint: wsEndpointWithEventBranch,
      listener: wsEndpointWithEventBranch.listeners[0]!,
      eventBranch: wsEventBranch,
    }),
    setWebSocketListenerEventResponse: async () => ({
      endpoint: wsEndpointWithEventBranch,
      listener: wsEndpointWithEventBranch.listeners[0]!,
      eventBranch: wsEventBranch,
    }),
  };
};

const createCommandContext = () => {
  const session = createSession();
  session.describe = vi.fn().mockResolvedValue({ revision: 3, handlerCount: 1 });
  session.list = vi.fn().mockResolvedValue([handler]);
  session.get = vi.fn().mockResolvedValue(handler);
  session.addTemp = vi.fn().mockResolvedValue({ revision: 4, handlerCount: 2, handler });
  session.removeTemp = vi.fn().mockResolvedValue({ revision: 5, handlerCount: 1 });
  session.reset = vi.fn().mockResolvedValue({ revision: 6, handlerCount: 1 });
  return { session, metadata: { pid: 42 } };
};

const createEventBranchContext = () => {
  const session = createSession();
  const listener = wsEndpointWithEventBranch.listeners[0]!;
  session.setWebSocketListenerEventBehavior = vi
    .fn()
    .mockResolvedValue({
      endpoint: wsEndpointWithEventBranch,
      listener,
      eventBranch: wsEventBranch,
    });
  session.setWebSocketListenerEventEnabled = vi.fn().mockResolvedValue({
    endpoint: wsEndpointWithEventBranch,
    listener,
    eventBranch: { ...wsEventBranch, enabled: false },
  });
  session.setWebSocketListenerEventCustomResponse = vi
    .fn()
    .mockResolvedValue({
      endpoint: wsEndpointWithEventBranch,
      listener,
      eventBranch: wsEventBranch,
    });
  session.setWebSocketListenerEventResponse = vi
    .fn()
    .mockResolvedValue({
      endpoint: wsEndpointWithEventBranch,
      listener,
      eventBranch: wsEventBranch,
    });
  return { session };
};

describe("shared CLI commands", () => {
  it("parses a command with positional, value, and boolean flags", () => {
    expect(parseArgs(["list", "--pid", "12", "--help"])).toEqual({
      positionals: ["list"],
      flags: { pid: "12", help: true },
    });
  });

  it("rejects a flag that requires a value when it is the final argument", () => {
    expect(() => parseArgs(["list", "--json"])).toThrow("Missing value");
  });

  it("rejects a flag that requires a value when the next argument is another flag", () => {
    expect(() => parseArgs(["list", "--pid", "--help"])).toThrow("Missing value");
  });

  it("finds a command by its name", () => {
    expect(findCommand("list")?.name).toBe("list");
  });

  it("returns no command for an unknown name", () => {
    expect(findCommand("unknown")).toBeUndefined();
  });

  it("lists set-custom-response in the command usage", () => {
    expect(commandUsage()).toContain("set-custom-response");
  });

  it("writes command output as formatted JSON", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    printJson({ ok: true, value: 1 });

    expect(write).toHaveBeenCalledWith('{\n  "ok": true,\n  "value": 1\n}\n');
    write.mockRestore();
  });
  it("uses the session adapter and returns an updated handler", async () => {
    const command = commands.find((item) => item.name === "set-behavior")!;
    await expect(
      command.execute(
        { session: createSession() },
        { flags: {}, positionals: ["set-behavior", "a", "delay"] },
      ),
    ).resolves.toMatchObject({ ok: true, revision: 1, handler: { id: "a", behavior: "delay" } });
  });

  it("stores a validated custom response without changing behavior", async () => {
    const command = commands.find((item) => item.name === "set-custom-response")!;
    await expect(
      command.execute(
        { session: createSession() },
        {
          flags: {
            json: '{"status":"201","contentType":"text/plain","response":"created","header":"{\\"X-Created\\":\\"yes\\"}"}',
          },
          positionals: ["set-custom-response", "a"],
        },
      ),
    ).resolves.toMatchObject({
      ok: true,
      revision: 1,
      handler: {
        behavior: "default",
        customResponse: { status: "201", contentType: "text/plain", response: "created" },
      },
    });
  });

  it("changes the enabled state of an HTTP handler", async () => {
    const context = { session: createSession() };

    await expect(
      findCommand("set-enabled")!.execute(context, {
        flags: {},
        positionals: ["set-enabled", "a", "false"],
      }),
    ).resolves.toMatchObject({ ok: true, revision: 1, handler: { id: "a", enabled: false } });
  });

  it("changes the global mock enabled state", async () => {
    const context = { session: createSession() };

    await expect(
      findCommand("set-mock-enabled")!.execute(context, {
        flags: {},
        positionals: ["set-mock-enabled", "false"],
      }),
    ).resolves.toMatchObject({ ok: true, revision: 1, mockEnabled: false });
  });

  it("rejects a handler enabled-state command without an enabled value", async () => {
    const context = { session: createSession() };

    await expect(
      findCommand("set-enabled")!.execute(context, {
        flags: {},
        positionals: ["set-enabled", "a"],
      }),
    ).rejects.toThrow("Usage: set-enabled <handlerId> <true|false>");
  });

  it("rejects a global mock enabled-state command with a non-boolean value", async () => {
    const context = { session: createSession() };

    await expect(
      findCommand("set-mock-enabled")!.execute(context, {
        flags: {},
        positionals: ["set-mock-enabled", "maybe"],
      }),
    ).rejects.toThrow("enabled must be true or false");
  });

  it("rejects a missing command argument before reaching the adapter", async () => {
    const command = commands.find((item) => item.name === "remove-temp")!;
    await expect(
      command.execute({ session: createSession() }, { flags: {}, positionals: ["remove-temp"] }),
    ).rejects.toThrow("Usage: remove-temp <id>");
  });

  it("rejects invalid custom response input before reaching the adapter", async () => {
    const command = commands.find((item) => item.name === "set-custom-response")!;
    await expect(
      command.execute(
        { session: createSession() },
        { flags: { json: "{" }, positionals: ["set-custom-response", "a"] },
      ),
    ).rejects.toThrow("Custom response must be valid JSON");
  });

  it("returns session metadata for the selected session", async () => {
    const context = createCommandContext();

    await expect(
      findCommand("session")!.execute(context, { flags: {}, positionals: ["session"] }),
    ).resolves.toMatchObject({ ok: true, pid: 42, revision: 3 });
  });

  it("returns the handlers available in the selected session", async () => {
    const context = createCommandContext();

    await expect(
      findCommand("list")!.execute(context, { flags: {}, positionals: ["list"] }),
    ).resolves.toMatchObject({ handlers: [handler] });
  });

  it("returns a handler requested by ID", async () => {
    const context = createCommandContext();

    await expect(
      findCommand("get")!.execute(context, { flags: {}, positionals: ["get", "a"] }),
    ).resolves.toMatchObject({ handler });
  });

  it("adds a temporary handler from a JSON input", async () => {
    const context = createCommandContext();

    await expect(
      findCommand("add-temp")!.execute(context, {
        flags: {
          json: '{"path":"/tmp","method":"get","contentType":"text/plain","status":"200","response":"ok"}',
        },
        positionals: ["add-temp"],
      }),
    ).resolves.toMatchObject({ revision: 4 });
  });

  it("removes a temporary handler by ID", async () => {
    const context = createCommandContext();

    await expect(
      findCommand("remove-temp")!.execute(context, {
        flags: {},
        positionals: ["remove-temp", "a"],
      }),
    ).resolves.toMatchObject({ revision: 5 });
  });

  it("resets the selected session", async () => {
    const context = createCommandContext();

    await expect(
      findCommand("reset")!.execute(context, { flags: {}, positionals: ["reset"] }),
    ).resolves.toMatchObject({ revision: 6 });
  });

  it("lists the WebSocket endpoints in a session", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-list")!.execute(context, { flags: {}, positionals: ["ws-list"] }),
    ).resolves.toMatchObject({ ok: true, endpoints: [wsEndpoint] });
  });

  it("returns a WebSocket endpoint by ID", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-get-endpoint")!.execute(context, {
        flags: {},
        positionals: ["ws-get-endpoint", wsEndpoint.endpointId],
      }),
    ).resolves.toMatchObject({ ok: true, endpoint: wsEndpoint });
  });

  it("adds a WebSocket endpoint from a JSON matcher", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-add-endpoint")!.execute(context, {
        flags: { json: '{"kind":"string","value":"ws://localhost/chat"}' },
        positionals: ["ws-add-endpoint"],
      }),
    ).resolves.toMatchObject({ ok: true, endpoint: wsEndpoint });
  });

  it("removes a WebSocket endpoint by ID", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-remove-endpoint")!.execute(context, {
        flags: {},
        positionals: ["ws-remove-endpoint", wsEndpoint.endpointId],
      }),
    ).resolves.toMatchObject({ ok: true, endpoints: [] });
  });

  it("disables a WebSocket endpoint", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-set-endpoint-enabled")!.execute(context, {
        flags: {},
        positionals: ["ws-set-endpoint-enabled", wsEndpoint.endpointId, "false"],
      }),
    ).resolves.toMatchObject({ ok: true, endpoint: wsEndpoint });
  });

  it("enables a WebSocket endpoint", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-set-endpoint-enabled")!.execute(context, {
        flags: {},
        positionals: ["ws-set-endpoint-enabled", wsEndpoint.endpointId, "true"],
      }),
    ).resolves.toMatchObject({ ok: true });
  });

  it("adds a WebSocket listener to an endpoint", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-add-listener")!.execute(context, {
        flags: { json: '{"preset":"send","options":{"message":"hello"}}' },
        positionals: ["ws-add-listener", wsEndpoint.endpointId],
      }),
    ).resolves.toMatchObject({ ok: true, listener: wsListener });
  });

  it("removes a WebSocket listener by ID", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-remove-listener")!.execute(context, {
        flags: {},
        positionals: ["ws-remove-listener", wsListener.info.id],
      }),
    ).resolves.toMatchObject({ ok: true, endpoints: [wsEndpoint] });
  });

  it("passes a temporary listener response schedule to the session", async () => {
    const session = createSession();
    session.addWebSocketListener = vi
      .fn()
      .mockResolvedValue({ endpoint: wsEndpointWithListener, listener: wsListener });
    const input = {
      endpointId: wsEndpoint.endpointId,
      behavior: { preset: "default" },
      response: {
        type: "send",
        dataType: "string",
        value: "default",
        delay: 300,
        repeat: { interval: 500, repetitions: 3 },
      },
      customResponse: { type: "send", dataType: "string", value: "custom", delay: 25 },
    };
    await findCommand("ws-add-listener")!.execute(
      { session },
      {
        flags: { json: JSON.stringify(input) },
        positionals: ["ws-add-listener"],
      },
    );
    expect(session.addWebSocketListener).toHaveBeenCalledWith(input);
  });

  it("uses the endpoint ID argument when a temporary listener JSON input omits it", async () => {
    const session = createSession();
    session.addWebSocketListener = vi
      .fn()
      .mockResolvedValue({ endpoint: wsEndpointWithListener, listener: wsListener });

    await findCommand("ws-add-listener")!.execute(
      { session },
      {
        flags: { json: "{}" },
        positionals: ["ws-add-listener", wsEndpoint.endpointId],
      },
    );
    expect(session.addWebSocketListener).toHaveBeenCalledWith({
      endpointId: wsEndpoint.endpointId,
      behavior: undefined,
      response: undefined,
      customResponse: undefined,
    });
  });

  it("forwards listener response payload and schedule together", async () => {
    const session = createSession();
    session.setWebSocketListenerResponse = vi
      .fn()
      .mockResolvedValue({ endpoint: wsEndpointWithListener, listener: wsListener });
    const context = { session };
    await findCommand("ws-set-listener-response")!.execute(context, {
      flags: {
        json: '{"type":"send","dataType":"string","value":"default","delay":300,"repeat":{"interval":500,"repetitions":"Infinity"}}',
      },
      positionals: ["ws-set-listener-response", wsListener.info.id],
    });
    expect(session.setWebSocketListenerResponse).toHaveBeenCalledWith(wsListener.info.id, {
      type: "send",
      dataType: "string",
      value: "default",
      delay: 300,
      repeat: { interval: 500, repetitions: "Infinity" },
    });
  });

  it("changes a WebSocket listener enabled state", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-set-listener-enabled")!.execute(context, {
        flags: {},
        positionals: ["ws-set-listener-enabled", wsListener.info.id, "false"],
      }),
    ).resolves.toMatchObject({ ok: true, listener: wsListener });
  });

  it("changes a WebSocket listener behavior", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-set-listener-behavior")!.execute(context, {
        flags: { json: '{"preset":"close"}' },
        positionals: ["ws-set-listener-behavior", wsListener.info.id],
      }),
    ).resolves.toMatchObject({ ok: true, listener: wsListener });
  });

  it("sets a custom response on a WebSocket listener", async () => {
    const session = createSession();
    const context = { session };

    await expect(
      findCommand("ws-set-listener-custom-response")!.execute(context, {
        flags: { json: '{"type":"send","dataType":"string","value":"hello"}' },
        positionals: ["ws-set-listener-custom-response", wsListener.info.id],
      }),
    ).resolves.toMatchObject({ ok: true, listener: { customResponse: { value: "hello" } } });
  });

  it("changes the enabled state of a logical WebSocket event branch", async () => {
    const context = createEventBranchContext();
    const command = findCommand("ws-set-listener-event-enabled")!;

    await expect(
      command.execute(context, {
        flags: {},
        positionals: [command.name, wsListener.info.id, wsEventBranch.eventType, "false"],
      }),
    ).resolves.toMatchObject({ ok: true, eventBranch: { enabled: false } });
  });

  it("changes the behavior of a logical WebSocket event branch", async () => {
    const context = createEventBranchContext();
    const command = findCommand("ws-set-listener-event-behavior")!;

    await expect(
      command.execute(context, {
        flags: { json: '{"preset":"echo"}' },
        positionals: [command.name, wsListener.info.id, wsEventBranch.eventType],
      }),
    ).resolves.toMatchObject({ ok: true, eventBranch: wsEventBranch });
    expect(context.session.setWebSocketListenerEventBehavior).toHaveBeenCalledWith(
      wsListener.info.id,
      wsEventBranch.eventType,
      { preset: "echo" },
    );
  });

  it("sets a custom response on a logical WebSocket event branch", async () => {
    const context = createEventBranchContext();
    const command = findCommand("ws-set-listener-event-custom-response")!;

    await expect(
      command.execute(context, {
        flags: { json: '{"type":"send","dataType":"string","value":"custom"}' },
        positionals: [command.name, wsListener.info.id, wsEventBranch.eventType],
      }),
    ).resolves.toMatchObject({ ok: true, eventBranch: wsEventBranch });
  });

  it("sets a default response on a logical WebSocket event branch", async () => {
    const context = createEventBranchContext();
    const command = findCommand("ws-set-listener-event-response")!;

    await expect(
      command.execute(context, {
        flags: { json: '{"type":"send","dataType":"string","value":"response"}' },
        positionals: [command.name, wsListener.info.id, wsEventBranch.eventType],
      }),
    ).resolves.toMatchObject({ ok: true, eventBranch: wsEventBranch });
  });

  it.each([
    ["ws-get-endpoint without an endpoint ID", {}, ["ws-get-endpoint"], "Usage: ws-get-endpoint"],
    ["ws-add-endpoint without a JSON matcher", {}, ["ws-add-endpoint"], "Usage: ws-add-endpoint"],
    [
      "ws-remove-endpoint without an endpoint ID",
      {},
      ["ws-remove-endpoint"],
      "Usage: ws-remove-endpoint",
    ],
    [
      "ws-set-endpoint-enabled without an enabled value",
      {},
      ["ws-set-endpoint-enabled", wsEndpoint.endpointId],
      "Usage: ws-set-endpoint-enabled",
    ],
    [
      "ws-set-endpoint-enabled with a non-boolean enabled value",
      {},
      ["ws-set-endpoint-enabled", wsEndpoint.endpointId, "maybe"],
      "enabled must be true or false",
    ],
    [
      "ws-add-listener without a behavior",
      {},
      ["ws-add-listener", wsEndpoint.endpointId],
      "Usage: ws-add-listener",
    ],
    [
      "ws-add-listener without an endpoint ID",
      { json: "{}" },
      ["ws-add-listener"],
      "Usage: ws-add-listener",
    ],
    [
      "ws-remove-listener without a listener ID",
      {},
      ["ws-remove-listener"],
      "Usage: ws-remove-listener",
    ],
    [
      "ws-set-listener-enabled without an enabled value",
      {},
      ["ws-set-listener-enabled", wsListener.info.id],
      "Usage: ws-set-listener-enabled",
    ],
    [
      "ws-set-listener-enabled with a non-boolean enabled value",
      {},
      ["ws-set-listener-enabled", wsListener.info.id, "maybe"],
      "enabled must be true or false",
    ],
    [
      "ws-set-listener-behavior without a behavior input",
      {},
      ["ws-set-listener-behavior", wsListener.info.id],
      "Usage: ws-set-listener-behavior",
    ],
    [
      "ws-set-listener-custom-response without a response input",
      {},
      ["ws-set-listener-custom-response", wsListener.info.id],
      "Usage: ws-set-listener-custom-response",
    ],
    [
      "ws-set-listener-response without a response input",
      {},
      ["ws-set-listener-response", wsListener.info.id],
      "Usage: ws-set-listener-response",
    ],
  ])("rejects %s", async (_scenario, flags, positionals, message) => {
    const context = { session: createSession() };

    await expect(
      findCommand(positionals[0]!)!.execute(context, { flags, positionals }),
    ).rejects.toThrow(message);
  });

  it("rejects ws-get-endpoint when endpoint is not found", async () => {
    const session = createSession();
    session.getWebSocketEndpoint = vi.fn().mockResolvedValue(undefined);
    await expect(
      findCommand("ws-get-endpoint")!.execute(
        { session },
        { flags: {}, positionals: ["ws-get-endpoint", "nonexistent"] },
      ),
    ).rejects.toThrow("WebSocket endpoint not found");
  });

  it.each([
    ["ws-add-endpoint", ["ws-add-endpoint"]],
    ["ws-add-listener", ["ws-add-listener", wsEndpoint.endpointId]],
    ["ws-set-listener-behavior", ["ws-set-listener-behavior", wsListener.info.id]],
    ["ws-set-listener-custom-response", ["ws-set-listener-custom-response", wsListener.info.id]],
    ["ws-set-listener-response", ["ws-set-listener-response", wsListener.info.id]],
  ])("rejects malformed JSON for %s", async (commandName, positionals) => {
    const context = { session: createSession() };

    await expect(
      findCommand(commandName)!.execute(context, { flags: { json: "{bad}" }, positionals }),
    ).rejects.toThrow();
  });

  it("reports when a requested HTTP handler is not found", async () => {
    const session = createSession();
    session.get = vi.fn().mockResolvedValue(undefined);
    const context = { session };

    await expect(
      findCommand("get")!.execute(context, { flags: {}, positionals: ["get", "none"] }),
    ).rejects.toThrow("Handler not found");
  });

  it("rejects an HTTP handler behavior that is not supported", async () => {
    const context = { session: createSession() };

    await expect(
      findCommand("set-behavior")!.execute(context, {
        flags: {},
        positionals: ["set-behavior", "a", "bad"],
      }),
    ).rejects.toThrow("Unknown behavior");
  });

  it("rejects a temporary handler command without its JSON input", async () => {
    const context = { session: createSession() };

    await expect(
      findCommand("add-temp")!.execute(context, { flags: {}, positionals: ["add-temp"] }),
    ).rejects.toThrow("Usage");
  });

  it.each([
    ["malformed custom-response JSON", { json: "{bad}" }, "Custom response must be valid JSON"],
    [
      "a custom-response JSON value that fails schema validation",
      { json: '{"status":"wrong"}' },
      undefined,
    ],
    ["a custom-response command without JSON input", {}, "Usage: set-custom-response"],
  ])("does not mutate a handler for %s", async (_scenario, flags, message) => {
    const session = createSession();
    session.setCustomResponse = vi.fn();
    const context = { session };

    const assertion = expect(
      findCommand("set-custom-response")!.execute(context, {
        flags,
        positionals: ["set-custom-response", "handler-a"],
      }),
    ).rejects;
    if (message) await assertion.toThrow(message);
    else await assertion.toThrow();

    expect(session.setCustomResponse).not.toHaveBeenCalled();
  });
});
