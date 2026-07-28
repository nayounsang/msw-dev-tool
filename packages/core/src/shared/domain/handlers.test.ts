import { describe, expect, it } from "vitest";
import {
  CustomBehavior,
  HttpHandlerBehavior,
  HttpMethod,
} from "../types";
import { getRowId } from "../utils/store";
import type { FlattenHandler, HttpHandler } from "../types";
import {
  appendFlattenHandler,
  getFlattenHandlerById,
  getHandlerBehavior,
  removeTempHandler,
  setHandlerBehavior,
} from "./handlers";

const makeHandler = (
  overrides: Partial<FlattenHandler> & Pick<FlattenHandler, "id" | "path" | "method">
): FlattenHandler => ({
  handler: {} as HttpHandler,
  behavior: HttpHandlerBehavior.DEFAULT,
  type: "default",
  ...overrides,
});

describe("getFlattenHandlerById / getHandlerBehavior", () => {
  it("finds handler and behavior by id", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const handlers = [
      makeHandler({
        id,
        path: "/a",
        method: HttpMethod.GET,
        behavior: CustomBehavior.DISABLE,
      }),
    ];

    expect(getFlattenHandlerById(handlers, id)?.path).toBe("/a");
    expect(getHandlerBehavior(handlers, id)).toBe(CustomBehavior.DISABLE);
    expect(getHandlerBehavior(handlers, "missing")).toBeUndefined();
  });
});

describe("setHandlerBehavior", () => {
  it("returns a new list with updated behavior for the matching id", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const otherId = getRowId({ path: "/b", method: "get" });
    const handlers = [
      makeHandler({ id, path: "/a", method: HttpMethod.GET }),
      makeHandler({ id: otherId, path: "/b", method: HttpMethod.GET }),
    ];

    const next = setHandlerBehavior(handlers, id, CustomBehavior.NETWORK_ERROR);

    expect(next).not.toBe(handlers);
    expect(getHandlerBehavior(next, id)).toBe(CustomBehavior.NETWORK_ERROR);
    expect(getHandlerBehavior(next, otherId)).toBe(HttpHandlerBehavior.DEFAULT);
    expect(handlers[0].behavior).toBe(HttpHandlerBehavior.DEFAULT);
  });
});

describe("removeTempHandler", () => {
  it("removes temp handlers and rejects default handlers", () => {
    const defaultId = getRowId({ path: "/d", method: "get" });
    const tempId = getRowId({ path: "/t", method: "post" });
    const handlers = [
      makeHandler({
        id: defaultId,
        path: "/d",
        method: HttpMethod.GET,
        type: "default",
      }),
      makeHandler({
        id: tempId,
        path: "/t",
        method: HttpMethod.POST,
        type: "temp",
      }),
    ];

    expect(() => removeTempHandler(handlers, defaultId)).toThrow(
      /cannot be deleted/
    );
    expect(() => removeTempHandler(handlers, "missing")).toThrow(/not found/);

    const next = removeTempHandler(handlers, tempId);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(defaultId);
  });
});

describe("appendFlattenHandler", () => {
  it("appends without mutating the original list", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const handlers = [
      makeHandler({ id, path: "/a", method: HttpMethod.GET }),
    ];
    const entry = makeHandler({
      id: getRowId({ path: "/b", method: "post" }),
      path: "/b",
      method: HttpMethod.POST,
      type: "temp",
    });

    const next = appendFlattenHandler(handlers, entry);
    expect(next).toHaveLength(2);
    expect(handlers).toHaveLength(1);
  });

  it("rejects duplicate ids", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const handlers = [
      makeHandler({ id, path: "/a", method: HttpMethod.GET }),
    ];

    expect(() =>
      appendFlattenHandler(
        handlers,
        makeHandler({ id, path: "/a", method: HttpMethod.GET, type: "temp" })
      )
    ).toThrow(/Duplicate handler id/);
  });
});
