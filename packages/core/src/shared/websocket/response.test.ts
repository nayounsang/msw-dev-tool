import { describe, expect, it } from "vitest";
import { parseWebSocketHex, toWebSocketSendData } from "./response";

describe("WebSocket custom response payloads", () => {
  it("parses case-insensitive hexadecimal bytes", () => {
    expect(Array.from(parseWebSocketHex("68 65 6C 6C 6F"))).toEqual([104, 101, 108, 108, 111]);
  });

  it("rejects malformed hexadecimal input", () => {
    expect(() => parseWebSocketHex("")).toThrow("Binary WebSocket response");
    expect(() => parseWebSocketHex("6 6g")).toThrow("Binary WebSocket response");
  });

  it("returns string, ArrayBuffer, and Blob payloads", async () => {
    expect(toWebSocketSendData({ type: "send", dataType: "string", value: "hello" })).toBe("hello");
    const buffer = toWebSocketSendData({ type: "send", dataType: "ArrayBuffer", value: "68 69" });
    expect(Array.from(new Uint8Array(buffer as ArrayBuffer))).toEqual([104, 105]);
    const blob = toWebSocketSendData({ type: "send", dataType: "Blob", value: "68 69", metadata: { type: "text/plain" } });
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe("text/plain");
    await expect((blob as Blob).text()).resolves.toBe("hi");
  });
});
