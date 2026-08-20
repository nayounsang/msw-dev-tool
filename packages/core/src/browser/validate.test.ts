import { describe, expect, it, vi } from "vitest";
import { isValidHtml, isValidUrl, isValidXml } from "./validate";

describe("isValidUrl", () => {
  it("accepts relative paths and absolute URLs", () => {
    expect(isValidUrl("/api/users")).toBe(true);
    expect(isValidUrl("https://example.com/a")).toBe(true);
  });

  it("rejects values that fail URL construction", () => {
    expect(isValidUrl("http://")).toBe(false);
  });
});

describe("isValidXml / isValidHtml", () => {
  it("accepts well-formed markup documents", () => {
    expect(isValidXml("<root></root>")).toBe(true);
    expect(isValidHtml("<div></div>")).toBe(true);
  });

  it("returns false when DOM parsing throws", () => {
    const spy = vi.spyOn(DOMParser.prototype, "parseFromString").mockImplementation(() => {
      throw new Error("parser unavailable");
    });
    expect(isValidXml("<root />")).toBe(false);
    spy.mockRestore();
  });
});
