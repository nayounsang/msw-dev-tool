import { describe, expect, it } from "vitest";
import { assertNodeRuntimeAvailable } from "./index";

describe("node stub", () => {
  it("is true", () => {
    expect(true).toBe(true);
  });
});
