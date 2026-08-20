import { afterEach, describe, expect, it, vi } from "vitest";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("node-cli executable", () => {
  it("prints a JSON error and exits non-zero when the CLI rejects", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    vi.doMock("./run", () => ({ runCli: vi.fn().mockRejectedValue(new Error("broken session")) }));

    await import("./cli");
    await flush();

    expect(stderr).toHaveBeenCalledWith(`${JSON.stringify({ ok: false, error: "broken session" })}\n`);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("serializes non-Error rejection values", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    vi.doMock("./run", () => ({ runCli: vi.fn().mockRejectedValue("broken") }));

    await import("./cli");
    await flush();

    expect(stderr).toHaveBeenCalledWith(`${JSON.stringify({ ok: false, error: "broken" })}\n`);
  });
});
