import { describe, expect, it } from "vitest";
import {
  CustomBehavior,
  HttpHandlerBehavior,
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "../types";
import { getRowId } from "../utils/store";
import { createFlattenHandler } from "../testing/createHttpHandler";
import {
  appendFlattenHandler,
  getFlattenHandlerById,
  getHandlerBehavior,
  getHandlerCustomResponse,
  removeTempHandler,
  setHandlerBehavior,
  setHandlerCustomResponse,
} from "./handlers";

describe("getFlattenHandlerById / getHandlerBehavior", () => {
  it("finds handler and behavior by id", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const handlers = [
      createFlattenHandler({
        id,
        path: "/a",
        method: HttpMethod.GET,
        behavior: CustomBehavior.DELAY,
      }),
    ];

    expect(getFlattenHandlerById(handlers, id)?.path).toBe("/a");
    expect(getHandlerBehavior(handlers, id)).toBe(CustomBehavior.DELAY);
    expect(getHandlerBehavior(handlers, "missing")).toBeUndefined();
  });
});

describe("setHandlerBehavior", () => {
  it("returns a new list with updated behavior for the matching id", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const otherId = getRowId({ path: "/b", method: "get" });
    const handlers = [
      createFlattenHandler({ id, path: "/a", method: HttpMethod.GET }),
      createFlattenHandler({ id: otherId, path: "/b", method: HttpMethod.GET }),
    ];

    const next = setHandlerBehavior(handlers, id, CustomBehavior.NETWORK_ERROR);

    expect(next).not.toBe(handlers);
    expect(getHandlerBehavior(next, id)).toBe(CustomBehavior.NETWORK_ERROR);
    expect(getHandlerBehavior(next, otherId)).toBe(HttpHandlerBehavior.DEFAULT);
    expect(handlers[0].behavior).toBe(HttpHandlerBehavior.DEFAULT);
  });
});

describe("setHandlerCustomResponse", () => {
  it("replaces only the selected handler's custom response", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const otherId = getRowId({ path: "/b", method: "get" });
    const handlers = [
      createFlattenHandler({ id, path: "/a", method: HttpMethod.GET }),
      createFlattenHandler({ id: otherId, path: "/b", method: HttpMethod.GET }),
    ];

    const first = setHandlerCustomResponse(handlers, id, {
      response: "first",
      contentType: MimeType.TEXT_PLAIN,
      status: StringHttpStatusCode.OK,
    });
    const nextResponse = {
      response: "latest",
      contentType: MimeType.TEXT_PLAIN,
      status: StringHttpStatusCode.ACCEPTED,
    } as const;
    const next = setHandlerCustomResponse(first, id, nextResponse);

    expect(getHandlerCustomResponse(next, id)).toEqual(nextResponse);
    expect(getHandlerCustomResponse(next, otherId)).toBeUndefined();
    expect(getHandlerCustomResponse(handlers, id)).toBeUndefined();
  });
});

describe("removeTempHandler", () => {
  it("removes temp handlers and rejects default handlers", () => {
    const defaultId = getRowId({ path: "/d", method: "get" });
    const tempId = getRowId({ path: "/t", method: "post" });
    const handlers = [
      createFlattenHandler({
        id: defaultId,
        path: "/d",
        method: HttpMethod.GET,
        type: "default",
      }),
      createFlattenHandler({
        id: tempId,
        path: "/t",
        method: HttpMethod.POST,
        type: "temp",
      }),
    ];

    expect(() => removeTempHandler(handlers, defaultId)).toThrow(/cannot be deleted/);
    expect(() => removeTempHandler(handlers, "missing")).toThrow(/not found/);

    const next = removeTempHandler(handlers, tempId);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(defaultId);
  });
});

describe("appendFlattenHandler", () => {
  it("appends without mutating the original list", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const handlers = [createFlattenHandler({ id, path: "/a", method: HttpMethod.GET })];
    const entry = createFlattenHandler({
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
    const handlers = [createFlattenHandler({ id, path: "/a", method: HttpMethod.GET })];

    expect(() =>
      appendFlattenHandler(
        handlers,
        createFlattenHandler({
          id,
          path: "/a",
          method: HttpMethod.GET,
          type: "temp",
        }),
      ),
    ).toThrow(/Duplicate handler id/);
  });
});
