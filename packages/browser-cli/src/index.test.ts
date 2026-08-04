import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cdp = vi.hoisted(() => ({
  connect: vi.fn(),
  listTargets: vi.fn(),
}));

vi.mock("./cdp", () => ({
  CdpClient: { connect: cdp.connect },
  listTargets: cdp.listTargets,
}));

import { runCli } from "./index";

const pageTarget = {
  id: "page-a",
  type: "page",
  title: "Example",
  url: "http://localhost:3000",
  webSocketDebuggerUrl: "ws://localhost:9222/page-a",
};

const runWithJsonOutput = async (argv: string[]) => {
  const output: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  try {
    await runCli(argv);
  } finally {
    process.stdout.write = originalWrite;
  }
  return JSON.parse(output.join(""));
};

describe("browser-cli", () => {
  beforeEach(() => {
    cdp.connect.mockReset();
    cdp.listTargets.mockReset();
    cdp.listTargets.mockResolvedValue([pageTarget, { id: "worker", type: "service_worker", title: "Worker", url: "http://localhost:3000" }]);
  });

  afterEach(() => vi.restoreAllMocks());

  it("lists page targets without exposing non-page targets", async () => {
    await expect(runWithJsonOutput(["tabs", "--cdp-url", "http://localhost:9222"])).resolves.toEqual({
      ok: true,
      cdpUrl: "http://localhost:9222",
      targets: [{ id: "page-a", title: "Example", url: "http://localhost:3000" }],
    });
  });

  it("rejects an unknown target before opening a CDP connection", async () => {
    await expect(runCli(["list", "--cdp-url", "http://localhost:9222", "--target", "missing"])).rejects.toThrow("No page target found for id: missing");
    expect(cdp.connect).not.toHaveBeenCalled();
  });

  it("runs a shared command against the selected page bridge", async () => {
    const call = vi.fn()
      .mockResolvedValueOnce({ result: { value: { revision: 2, handlerCount: 1, handler: { id: "handler-a", behavior: "delay" } } } });
    const close = vi.fn();
    cdp.connect.mockResolvedValue({ call, close });

    await expect(runWithJsonOutput([
      "set-behavior", "handler-a", "delay", "--cdp-url", "http://localhost:9222", "--target", "page-a",
    ])).resolves.toMatchObject({ ok: true, revision: 2, handler: { id: "handler-a", behavior: "delay" }, targetId: "page-a" });
    expect(call).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledOnce();
  });
});
