import { afterEach, describe, expect, it, vi } from "vitest";
import { WebSocketServer } from "ws";
import { CdpClient, listTargets } from "./cdp";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("listTargets", () => {
  it("returns the Chrome target list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: "page", type: "page", title: "Page", url: "http://localhost" }]))));
    await expect(listTargets("http://localhost:9222")).resolves.toMatchObject([{ id: "page" }]);
  });
  it("reports an unsuccessful Chrome target response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503, statusText: "Unavailable" })));
    await expect(listTargets("http://localhost:9222")).rejects.toThrow("Failed to list Chrome targets: 503 Unavailable");
  });

  it("preserves a non-timeout fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Chrome is unavailable")));
    await expect(listTargets("http://localhost:9222")).rejects.toThrow("Chrome is unavailable");
  });

  it("times out instead of leaving an agent command waiting for Chrome", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_: URL, options: RequestInit) =>
      new Promise((_, reject) => {
        options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })
    ));

    const request = listTargets("http://localhost:9222", 5);
    const assertion = expect(request).rejects.toThrow("Timed out while listing Chrome targets after 5ms");
    await vi.advanceTimersByTimeAsync(5);
    await assertion;
  });
});

describe("CdpClient", () => {
  it("rejects an in-flight command when Chrome closes the socket", async () => {
    const server = new WebSocketServer({ port: 0 });
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP test server address");
    server.on("connection", (socket) => socket.once("message", () => socket.close()));

    const client = await CdpClient.connect(`ws://127.0.0.1:${address.port}`);
    try {
      await expect(client.call("Runtime.evaluate")).rejects.toThrow("CDP connection closed");
    } finally {
      client.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("rejects an in-flight command when Chrome reports a protocol error", async () => {
    const server = new WebSocketServer({ port: 0 });
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP test server address");
    server.on("connection", (socket) => socket.once("message", () => {
      socket.send(JSON.stringify({ id: 1, error: { message: "Runtime disabled" } }));
    }));

    const client = await CdpClient.connect(`ws://127.0.0.1:${address.port}`);
    try {
      await expect(client.call("Runtime.evaluate")).rejects.toThrow("CDP error: Runtime disabled");
    } finally {
      client.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("ignores malformed CDP frames and continues with the next valid response", async () => {
    const server = new WebSocketServer({ port: 0 });
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP test server address");
    server.on("connection", (socket) => socket.once("message", () => {
      socket.send("not-json");
      socket.send(JSON.stringify({ id: 1, result: { value: "ok" } }));
    }));

    const client = await CdpClient.connect(`ws://127.0.0.1:${address.port}`);
    try {
      await expect(client.call("Runtime.evaluate")).resolves.toEqual({ value: "ok" });
    } finally {
      client.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
