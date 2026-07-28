import { describe, expect, it } from "vitest";
import {
  CustomBehavior,
  HttpHandlerBehavior,
  HttpMethod,
} from "../types";
import { getRowId } from "./store";
import { mergeStorageData } from "./storage";
import type { FlattenHandler, HttpHandler } from "../types";

const makeFlatten = (
  overrides: Partial<FlattenHandler> & Pick<FlattenHandler, "id" | "path" | "method">
): FlattenHandler => ({
  handler: {} as HttpHandler,
  behavior: HttpHandlerBehavior.DEFAULT,
  type: "default",
  ...overrides,
});

describe("mergeStorageData", () => {
  it("overlays saved behavior and type onto matching handlers", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const merged = mergeStorageData(
      {
        flattenHandlers: [
          makeFlatten({ id, path: "/a", method: HttpMethod.GET }),
        ],
      },
      {
        flattenHandlers: [
          makeFlatten({
            id,
            path: "/a",
            method: HttpMethod.GET,
            behavior: CustomBehavior.NETWORK_ERROR,
            type: "default",
          }),
        ],
      }
    );

    expect(merged.flattenHandlers).toHaveLength(1);
    expect(merged.flattenHandlers[0].behavior).toBe(
      CustomBehavior.NETWORK_ERROR
    );
  });

  it("keeps incoming handler when there is no saved match", () => {
    const id = getRowId({ path: "/new", method: "get" });
    const incoming = makeFlatten({
      id,
      path: "/new",
      method: HttpMethod.GET,
      behavior: HttpHandlerBehavior.DEFAULT,
    });

    const merged = mergeStorageData(
      { flattenHandlers: [incoming] },
      { flattenHandlers: [] }
    );

    expect(merged.flattenHandlers[0]).toEqual(incoming);
  });

  it("appends saved temp handlers that are not in the incoming list", () => {
    const defaultId = getRowId({ path: "/a", method: "get" });
    const tempId = getRowId({ path: "/temp", method: "post" });

    const merged = mergeStorageData(
      {
        flattenHandlers: [
          makeFlatten({
            id: defaultId,
            path: "/a",
            method: HttpMethod.GET,
          }),
        ],
      },
      {
        flattenHandlers: [
          makeFlatten({
            id: tempId,
            path: "/temp",
            method: HttpMethod.POST,
            type: "temp",
            behavior: CustomBehavior.DISABLE,
          }),
        ],
      }
    );

    expect(merged.flattenHandlers.map((h) => h.id)).toEqual([
      defaultId,
      tempId,
    ]);
    expect(merged.flattenHandlers[1].type).toBe("temp");
  });

  it("does not append saved default handlers that are missing from incoming", () => {
    const incomingId = getRowId({ path: "/a", method: "get" });
    const orphanId = getRowId({ path: "/gone", method: "get" });

    const merged = mergeStorageData(
      {
        flattenHandlers: [
          makeFlatten({
            id: incomingId,
            path: "/a",
            method: HttpMethod.GET,
          }),
        ],
      },
      {
        flattenHandlers: [
          makeFlatten({
            id: orphanId,
            path: "/gone",
            method: HttpMethod.GET,
            type: "default",
          }),
        ],
      }
    );

    expect(merged.flattenHandlers).toHaveLength(1);
    expect(merged.flattenHandlers[0].id).toBe(incomingId);
  });
});
