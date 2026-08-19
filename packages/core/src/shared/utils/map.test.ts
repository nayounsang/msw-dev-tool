import { describe, expect, it } from "vitest";
import { deleteEmptySet } from "./map";

describe("deleteEmptySet", () => {
  it("removes the map entry when the set is empty", () => {
    const map = new Map<string, Set<number>>([["a", new Set()]]);

    deleteEmptySet(map, "a", map.get("a")!);

    expect(map.has("a")).toBe(false);
  });

  it("keeps the map entry when the set still has values", () => {
    const values = new Set([1]);
    const map = new Map<string, Set<number>>([["a", values]]);

    deleteEmptySet(map, "a", values);

    expect(map.get("a")).toBe(values);
  });
});
