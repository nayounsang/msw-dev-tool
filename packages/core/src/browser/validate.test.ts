import { describe, expect, it } from "vitest";
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
});
