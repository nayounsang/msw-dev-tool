import { describe, expect, it, vi } from "vitest";

const socketState = vi.hoisted(() => {
  const sockets: Array<any> = [];
  class FakeSocket {
    private listeners = new Map<string, Array<(...args: any[]) => void>>();
    public constructor(_: string) {
      sockets.push(this);
      queueMicrotask(() => this.emit("open"));
    }
    public on(name: string, listener: (...args: any[]) => void) {
      this.add(name, listener);
      return this;
    }
    public once(name: string, listener: (...args: any[]) => void) {
      this.add(name, listener);
      return this;
    }
    public off(name: string, listener: (...args: any[]) => void) {
      this.listeners.set(
        name,
        (this.listeners.get(name) ?? []).filter((entry) => entry !== listener),
      );
      return this;
    }
    public emit(name: string, ...args: any[]) {
      for (const listener of this.listeners.get(name) ?? []) listener(...args);
    }
    private add(name: string, listener: (...args: any[]) => void) {
      this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
    }
    public send(_: string, callback: (error?: Error) => void) {
      callback(state.sendError ? new Error("send failed") : undefined);
    }
    public close() {
      this.emit("close");
    }
    public terminate() {}
  }
  const state = { sendError: false };
  return { sockets, FakeSocket, state };
});
vi.mock("ws", () => ({ default: socketState.FakeSocket }));
import { CdpClient } from "./cdp";

describe("CdpClient protocol transport", () => {
  it("resolves matching responses and ignores malformed or unrelated messages", async () => {
    const client = await CdpClient.connect("ws://test");
    const socket = socketState.sockets.at(-1)!;
    const pending = client.call("Runtime.evaluate");
    socket.emit("message", "not-json");
    socket.emit("message", JSON.stringify({ id: 999, result: {} }));
    socket.emit("message", JSON.stringify({ id: 1, result: { value: 1 } }));
    await expect(pending).resolves.toEqual({ value: 1 });
    client.close();
  });

  it("rejects protocol errors, transport errors, and command timeouts", async () => {
    vi.useFakeTimers();
    const client = await CdpClient.connect("ws://test");
    const socket = socketState.sockets.at(-1)!;
    const protocol = expect(client.call("Runtime")).rejects.toThrow("CDP error: failed");
    socket.emit("message", JSON.stringify({ id: 1, error: { message: "failed" } }));
    await protocol;
    const timeout = expect(client.call("Timeout", undefined, 5)).rejects.toThrow(
      "Timed out waiting for CDP Timeout after 5ms",
    );
    await vi.advanceTimersByTimeAsync(5);
    await timeout;
    const connection = expect(client.call("Close")).rejects.toThrow("boom");
    socket.emit("error", new Error("boom"));
    await connection;
    vi.useRealTimers();
  });

  it("rejects a command when the socket send callback reports an error", async () => {
    socketState.state.sendError = true;
    const client = await CdpClient.connect("ws://test");
    await expect(client.call("Runtime")).rejects.toThrow("send failed");
    socketState.state.sendError = false;
  });
});
