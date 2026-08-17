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

describe("CdpBrowserCliSession", () => {
  it("calls the page control bridge and returns its serializable result", async () => {
    const call = vi.fn().mockResolvedValue({ result: { value: { revision: 2, handlerCount: 1 } } });
    const client = { call } as unknown as CdpClient;
    const session = new CdpBrowserCliSession(client);

    await expect(session.setBehavior("handler-a", "delay")).resolves.toEqual({ revision: 2, handlerCount: 1 });
    expect(call).toHaveBeenCalledWith("Runtime.evaluate", expect.objectContaining({
      awaitPromise: true,
      returnByValue: true,
      expression: expect.stringContaining("__MSW_DEV_TOOL_CONTROL__"),
    }));
    expect(call).toHaveBeenCalledWith("Runtime.evaluate", expect.objectContaining({
      expression: expect.stringContaining('bridge.methods?.["setBehavior"] !== 1'),
    }));
    expect(call.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      expression: expect.not.stringContaining("bridge.version"),
    }));
  });

  it("sends custom response configuration through the page control bridge", async () => {
    const call = vi.fn().mockResolvedValue({ result: { value: { revision: 3, handlerCount: 1 } } });
    const session = new CdpBrowserCliSession({ call } as unknown as CdpClient);

    await expect(session.setCustomResponse("handler-a", { status: 201, body: "created" })).resolves.toEqual({ revision: 3, handlerCount: 1 });
    expect(call).toHaveBeenCalledWith("Runtime.evaluate", expect.objectContaining({
      expression: expect.stringContaining('"setCustomResponse"'),
    }));
  });

  it("surfaces a bridge error from Chrome", async () => {
    const client = { call: vi.fn().mockResolvedValue({ exceptionDetails: { exception: { description: "Error: bridge unavailable\n    at internal webpack frame" } } }) } as unknown as CdpClient;
    await expect(new CdpBrowserCliSession(client).list()).rejects.toThrow("Error: bridge unavailable");
    await expect(new CdpBrowserCliSession(client).list()).rejects.not.toThrow("webpack");
  });

  it.each([
    ["the capability manifest is missing", {}, true],
    ["the method version is incompatible", { methods: { setCustomResponse: 2 } }, true],
    ["the method implementation is missing", { methods: { setCustomResponse: 1 } }, false],
  ])("rejects before invocation when %s", async (_scenario, bridge, includeImplementation) => {
    const setCustomResponse = vi.fn();
    const { client } = createEvaluatingClient({
      ...bridge,
      ...(includeImplementation ? { setCustomResponse } : {}),
    });

    await expect(new CdpBrowserCliSession(client).setCustomResponse("handler-a", {})).rejects.toThrow(
      'MSW Dev Tool browser control method "setCustomResponse" version 1 is unavailable. Update @msw-dev-tool/core.'
    );
    expect(setCustomResponse).not.toHaveBeenCalled();
  });

  it("ignores capability versions for unrelated methods", async () => {
    const setBehavior = vi.fn().mockReturnValue({ revision: 4, handlerCount: 1 });
    const { client } = createEvaluatingClient({
      methods: { list: 99, setBehavior: 1 },
      setBehavior,
    });

    await expect(new CdpBrowserCliSession(client).setBehavior("handler-a", "delay")).resolves.toEqual({
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
    await session.addTemp({ path: "/tmp", method: "get", contentType: "text/plain", status: "200" });
    await session.removeTemp("a");
    await session.reset();
    expect(call).toHaveBeenCalledTimes(6);
  });

  it("uses the CDP text field when no exception description is present", async () => {
    const client = { call: vi.fn().mockResolvedValue({ exceptionDetails: { text: "evaluation failed" } }) } as unknown as CdpClient;
    await expect(new CdpBrowserCliSession(client).describe()).rejects.toThrow("evaluation failed");
  });

  it("falls back to the generic evaluation error when Chrome provides no message", async () => {
    const client = { call: vi.fn().mockResolvedValue({ exceptionDetails: { text: "" } }) } as unknown as CdpClient;
    await expect(new CdpBrowserCliSession(client).describe()).rejects.toThrow("CDP evaluation failed");
  });
});
