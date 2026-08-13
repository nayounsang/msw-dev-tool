import { describe, expect, it, vi } from "vitest";
import { CdpClient } from "./cdp";
import { CdpBrowserCliSession } from "./session";

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
      expression: expect.stringContaining("bridge.version !== 2"),
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

  it("rejects an incompatible browser control protocol before invoking a command", async () => {
    const client = { call: vi.fn().mockResolvedValue({ exceptionDetails: { exception: { description: "Error: Incompatible MSW Dev Tool browser control protocol\n    at eval" } } }) } as unknown as CdpClient;
    await expect(new CdpBrowserCliSession(client).list()).rejects.toThrow(
      "Incompatible MSW Dev Tool browser control protocol"
    );
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
