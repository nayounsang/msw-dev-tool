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
      expression: expect.stringContaining("bridge.version !== 1"),
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
});
