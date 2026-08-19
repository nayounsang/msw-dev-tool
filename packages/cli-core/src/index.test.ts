import { describe, expect, it, vi } from "vitest";
import type { WebSocketEndpointConfig, WebSocketListenerConfig } from "@msw-dev-tool/core/shared";
import { CliHandler, CliSession, commandUsage, commands, findCommand, parseArgs, printJson } from "./index";

const handler: CliHandler = { id: "a", path: "/a", method: "get", behavior: "default", type: "default" };

const wsEndpoint: WebSocketEndpointConfig = {
  info: { id: "ws:ep:1", kind: "websocket", endpoint: "ws://localhost/chat", operation: "endpoint", source: "temp" },
  endpointId: "ws:ep:1",
  matcher: { kind: "string", value: "ws://localhost/chat" },
  enabled: true,
  listeners: [],
};

const wsListener: WebSocketListenerConfig = {
  info: { id: "ws:ep:1:message:0", kind: "websocket", endpoint: "ws://localhost/chat", operation: "message", source: "temp" },
  endpointId: "ws:ep:1",
  event: "message",
  enabled: true,
  behavior: { preset: "send", options: { message: "hello" } },
};

const wsEndpointWithListener: WebSocketEndpointConfig = { ...wsEndpoint, listeners: [wsListener] };

const createSession = (): CliSession => {
  const handlers = [{ ...handler }];
  let revision = 0;
  const info = () => ({ revision, handlerCount: handlers.length });
  return {
    describe: async () => info(), list: async () => handlers, get: async (id) => handlers.find((item) => item.id === id),
    setBehavior: async (id, behavior) => { const item = handlers.find((entry) => entry.id === id); if (!item) throw new Error(`Handler not found for id: ${id}`); item.behavior = behavior; revision += 1; return { ...info(), handler: item }; },
    setCustomResponse: async (id, customResponse) => { const item = handlers.find((entry) => entry.id === id); if (!item) throw new Error(`Handler not found for id: ${id}`); item.customResponse = customResponse; revision += 1; return { ...info(), handler: item }; },
    addTemp: async () => { throw new Error("not used"); }, removeTemp: async () => { throw new Error("not used"); }, reset: async () => info(),
    listWebSocket: async () => [wsEndpoint],
    getWebSocketEndpoint: async (id) => id === wsEndpoint.endpointId ? wsEndpoint : undefined,
    addWebSocketEndpoint: async () => ({ endpoint: wsEndpoint }),
    removeWebSocketEndpoint: async () => ({ endpoints: [] }),
    setWebSocketEndpointEnabled: async () => ({ endpoint: wsEndpoint }),
    addWebSocketListener: async () => ({ endpoint: wsEndpointWithListener, listener: wsListener }),
    removeWebSocketListener: async () => ({ endpoints: [wsEndpoint] }),
    setWebSocketListenerEnabled: async () => ({ endpoint: wsEndpointWithListener, listener: wsListener }),
    setWebSocketListenerBehavior: async () => ({ endpoint: wsEndpointWithListener, listener: wsListener }),
  };
};

describe("shared CLI commands", () => {
  it("parses positional, value, and boolean flags and rejects missing values", () => {
    expect(parseArgs(["list", "--pid", "12", "--help"])).toEqual({ positionals: ["list"], flags: { pid: "12", help: true } });
    expect(() => parseArgs(["list", "--json"])).toThrow("Missing value");
    expect(() => parseArgs(["list", "--pid", "--help"])).toThrow("Missing value");
  });

  it("exposes command lookup, usage, and JSON output", () => {
    expect(findCommand("list")?.name).toBe("list");
    expect(findCommand("unknown")).toBeUndefined();
    expect(commandUsage()).toContain("set-custom-response");
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    printJson({ ok: true, value: 1 });
    expect(write).toHaveBeenCalledWith('{\n  "ok": true,\n  "value": 1\n}\n');
    write.mockRestore();
  });
  it("uses the session adapter and returns an updated handler", async () => {
    const command = commands.find((item) => item.name === "set-behavior")!;
    await expect(command.execute({ session: createSession() }, { flags: {}, positionals: ["set-behavior", "a", "delay"] })).resolves.toMatchObject({ ok: true, revision: 1, handler: { id: "a", behavior: "delay" } });
  });

  it("stores a validated custom response without changing behavior", async () => {
    const command = commands.find((item) => item.name === "set-custom-response")!;
    await expect(command.execute(
      { session: createSession() },
      { flags: { json: '{"status":201,"body":"created","headers":{"X-Created":"yes"}}' }, positionals: ["set-custom-response", "a"] }
    )).resolves.toMatchObject({
      ok: true,
      revision: 1,
      handler: { behavior: "default", customResponse: { status: 201, body: "created" } },
    });
  });

  it("rejects a missing command argument before reaching the adapter", async () => {
    const command = commands.find((item) => item.name === "remove-temp")!;
    await expect(command.execute({ session: createSession() }, { flags: {}, positionals: ["remove-temp"] })).rejects.toThrow("Usage: remove-temp <id>");
  });

  it("rejects invalid custom response input before reaching the adapter", async () => {
    const command = commands.find((item) => item.name === "set-custom-response")!;
    await expect(command.execute(
      { session: createSession() },
      { flags: { json: "{" }, positionals: ["set-custom-response", "a"] }
    )).rejects.toThrow("Custom response must be valid JSON");
  });

  it("executes read, temporary, removal, and reset commands with metadata", async () => {
    const session = createSession();
    session.describe = vi.fn().mockResolvedValue({ revision: 3, handlerCount: 1 });
    session.list = vi.fn().mockResolvedValue([handler]);
    session.get = vi.fn().mockResolvedValue(handler);
    session.addTemp = vi.fn().mockResolvedValue({ revision: 4, handlerCount: 2, handler });
    session.removeTemp = vi.fn().mockResolvedValue({ revision: 5, handlerCount: 1 });
    session.reset = vi.fn().mockResolvedValue({ revision: 6, handlerCount: 1 });
    const context = { session, metadata: { pid: 42 } };
    await expect(findCommand("session")!.execute(context, { flags: {}, positionals: ["session"] })).resolves.toMatchObject({ ok: true, pid: 42, revision: 3 });
    await expect(findCommand("list")!.execute(context, { flags: {}, positionals: ["list"] })).resolves.toMatchObject({ handlers: [handler] });
    await expect(findCommand("get")!.execute(context, { flags: {}, positionals: ["get", "a"] })).resolves.toMatchObject({ handler });
    await expect(findCommand("add-temp")!.execute(context, { flags: { json: '{"path":"/tmp","method":"get","contentType":"text/plain","status":"200","response":"ok"}' }, positionals: ["add-temp"] })).resolves.toMatchObject({ revision: 4 });
    await expect(findCommand("remove-temp")!.execute(context, { flags: {}, positionals: ["remove-temp", "a"] })).resolves.toMatchObject({ revision: 5 });
    await expect(findCommand("reset")!.execute(context, { flags: {}, positionals: ["reset"] })).resolves.toMatchObject({ revision: 6 });
  });

  it("executes ws-list and ws-get-endpoint", async () => {
    const session = createSession();
    const context = { session };
    await expect(findCommand("ws-list")!.execute(context, { flags: {}, positionals: ["ws-list"] })).resolves.toMatchObject({ ok: true, endpoints: [wsEndpoint] });
    await expect(findCommand("ws-get-endpoint")!.execute(context, { flags: {}, positionals: ["ws-get-endpoint", wsEndpoint.endpointId] })).resolves.toMatchObject({ ok: true, endpoint: wsEndpoint });
  });

  it("executes ws-add-endpoint and ws-remove-endpoint", async () => {
    const session = createSession();
    const context = { session };
    await expect(findCommand("ws-add-endpoint")!.execute(context, { flags: { json: '{"kind":"string","value":"ws://localhost/chat"}' }, positionals: ["ws-add-endpoint"] })).resolves.toMatchObject({ ok: true, endpoint: wsEndpoint });
    await expect(findCommand("ws-remove-endpoint")!.execute(context, { flags: {}, positionals: ["ws-remove-endpoint", wsEndpoint.endpointId] })).resolves.toMatchObject({ ok: true, endpoints: [] });
  });

  it("executes ws-set-endpoint-enabled", async () => {
    const session = createSession();
    const context = { session };
    await expect(findCommand("ws-set-endpoint-enabled")!.execute(context, { flags: {}, positionals: ["ws-set-endpoint-enabled", wsEndpoint.endpointId, "false"] })).resolves.toMatchObject({ ok: true, endpoint: wsEndpoint });
    await expect(findCommand("ws-set-endpoint-enabled")!.execute(context, { flags: {}, positionals: ["ws-set-endpoint-enabled", wsEndpoint.endpointId, "true"] })).resolves.toMatchObject({ ok: true });
  });

  it("executes ws-add-listener and ws-remove-listener", async () => {
    const session = createSession();
    const context = { session };
    await expect(findCommand("ws-add-listener")!.execute(context, { flags: { json: '{"preset":"send","options":{"message":"hello"}}' }, positionals: ["ws-add-listener", wsEndpoint.endpointId] })).resolves.toMatchObject({ ok: true, listener: wsListener });
    await expect(findCommand("ws-remove-listener")!.execute(context, { flags: {}, positionals: ["ws-remove-listener", wsListener.info.id] })).resolves.toMatchObject({ ok: true, endpoints: [wsEndpoint] });
  });

  it("executes ws-set-listener-enabled and ws-set-listener-behavior", async () => {
    const session = createSession();
    const context = { session };
    await expect(findCommand("ws-set-listener-enabled")!.execute(context, { flags: {}, positionals: ["ws-set-listener-enabled", wsListener.info.id, "false"] })).resolves.toMatchObject({ ok: true, listener: wsListener });
    await expect(findCommand("ws-set-listener-behavior")!.execute(context, { flags: { json: '{"preset":"close"}' }, positionals: ["ws-set-listener-behavior", wsListener.info.id] })).resolves.toMatchObject({ ok: true, listener: wsListener });
  });

  it("rejects ws commands with missing arguments", async () => {
    const session = createSession();
    const context = { session };
    await expect(findCommand("ws-get-endpoint")!.execute(context, { flags: {}, positionals: ["ws-get-endpoint"] })).rejects.toThrow("Usage: ws-get-endpoint");
    await expect(findCommand("ws-add-endpoint")!.execute(context, { flags: {}, positionals: ["ws-add-endpoint"] })).rejects.toThrow("Usage: ws-add-endpoint");
    await expect(findCommand("ws-remove-endpoint")!.execute(context, { flags: {}, positionals: ["ws-remove-endpoint"] })).rejects.toThrow("Usage: ws-remove-endpoint");
    await expect(findCommand("ws-set-endpoint-enabled")!.execute(context, { flags: {}, positionals: ["ws-set-endpoint-enabled", wsEndpoint.endpointId] })).rejects.toThrow("Usage: ws-set-endpoint-enabled");
    await expect(findCommand("ws-set-endpoint-enabled")!.execute(context, { flags: {}, positionals: ["ws-set-endpoint-enabled", wsEndpoint.endpointId, "maybe"] })).rejects.toThrow("enabled must be true or false");
    await expect(findCommand("ws-add-listener")!.execute(context, { flags: {}, positionals: ["ws-add-listener", wsEndpoint.endpointId] })).rejects.toThrow("Usage: ws-add-listener");
    await expect(findCommand("ws-remove-listener")!.execute(context, { flags: {}, positionals: ["ws-remove-listener"] })).rejects.toThrow("Usage: ws-remove-listener");
    await expect(findCommand("ws-set-listener-enabled")!.execute(context, { flags: {}, positionals: ["ws-set-listener-enabled", wsListener.info.id] })).rejects.toThrow("Usage: ws-set-listener-enabled");
    await expect(findCommand("ws-set-listener-enabled")!.execute(context, { flags: {}, positionals: ["ws-set-listener-enabled", wsListener.info.id, "maybe"] })).rejects.toThrow("enabled must be true or false");
    await expect(findCommand("ws-set-listener-behavior")!.execute(context, { flags: {}, positionals: ["ws-set-listener-behavior", wsListener.info.id] })).rejects.toThrow("Usage: ws-set-listener-behavior");
  });

  it("rejects ws-get-endpoint when endpoint is not found", async () => {
    const session = createSession();
    session.getWebSocketEndpoint = vi.fn().mockResolvedValue(undefined);
    await expect(findCommand("ws-get-endpoint")!.execute({ session }, { flags: {}, positionals: ["ws-get-endpoint", "nonexistent"] })).rejects.toThrow("WebSocket endpoint not found");
  });

  it("rejects ws commands with invalid JSON", async () => {
    const session = createSession();
    const context = { session };
    await expect(findCommand("ws-add-endpoint")!.execute(context, { flags: { json: "{bad}" }, positionals: ["ws-add-endpoint"] })).rejects.toThrow();
    await expect(findCommand("ws-add-listener")!.execute(context, { flags: { json: "{bad}" }, positionals: ["ws-add-listener", wsEndpoint.endpointId] })).rejects.toThrow();
    await expect(findCommand("ws-set-listener-behavior")!.execute(context, { flags: { json: "{bad}" }, positionals: ["ws-set-listener-behavior", wsListener.info.id] })).rejects.toThrow();
  });

  it("reports missing handlers and invalid command inputs", async () => {
    const session = createSession();
    session.get = vi.fn().mockResolvedValue(undefined);
    const context = { session };
    await expect(findCommand("get")!.execute(context, { flags: {}, positionals: ["get", "none"] })).rejects.toThrow("Handler not found");
    await expect(findCommand("set-behavior")!.execute(context, { flags: {}, positionals: ["set-behavior", "a", "bad"] })).rejects.toThrow("Unknown behavior");
    await expect(findCommand("add-temp")!.execute(context, { flags: {}, positionals: ["add-temp"] })).rejects.toThrow("Usage");
  });
});
