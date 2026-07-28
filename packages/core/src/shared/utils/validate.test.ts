import { describe, expect, it } from "vitest";
import { isHttpHandler, isValidJson } from "./validate";

describe("isHttpHandler", () => {
  it("returns true when info has method and path", () => {
    const handler = {
      info: { method: "GET", path: "/x" },
    };
    expect(isHttpHandler(handler)).toBe(true);
  });

  it("returns false when info shape is missing", () => {
    expect(isHttpHandler({})).toBe(false);
    expect(isHttpHandler({ info: {} })).toBe(false);
    expect(isHttpHandler(null)).toBe(false);
  });
});

describe("isValidJson", () => {
  it("accepts parseable JSON and rejects invalid strings", () => {
    expect(isValidJson('{"a":1}')).toBe(true);
    expect(isValidJson("[]")).toBe(true);
    expect(isValidJson("{")).toBe(false);
    expect(isValidJson("")).toBe(false);
  });
});
