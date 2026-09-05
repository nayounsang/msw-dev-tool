import { describe, expect, it } from "vitest";
import { isHttpHandler, isValidJson } from "./validate";

describe("isHttpHandler", () => {
  it("returns true when info has method and path", () => {
    const handler = {
      info: { method: "GET", path: "/x" },
    };
    expect(isHttpHandler(handler)).toBe(true);
  });

  it.each([
    ["the handler has no info", {}],
    ["the handler info has no method or path", { info: {} }],
    ["the handler is null", null],
  ])("returns false when %s", (_scenario, handler) => {
    expect(isHttpHandler(handler)).toBe(false);
  });
});

describe("isValidJson", () => {
  it.each([
    ["true", "a JSON object", '{"a":1}', true],
    ["true", "a JSON array", "[]", true],
    ["false", "an incomplete JSON object", "{", false],
    ["false", "an empty string", "", false],
  ])("returns %s for %s", (_expected, _scenario, value, result) => {
    expect(isValidJson(value)).toBe(result);
  });
});
