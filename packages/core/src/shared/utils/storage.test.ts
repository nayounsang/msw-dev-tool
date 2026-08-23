import { describe, expect, it } from "vitest";
import {
  CustomBehavior,
  HttpHandlerBehavior,
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "../types";
import { getRowId } from "./store";
import { mergeStorageData } from "./storage";
import { createFlattenHandler } from "../testing/createHttpHandler";

const makeFlatten = createFlattenHandler;
describe("mergeStorageData", () => {
  it("overlays saved behavior and type onto matching handlers", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const merged = mergeStorageData(
      {
        flattenHandlers: [makeFlatten({ id, path: "/a", method: HttpMethod.GET })],
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
      },
    );

    expect(merged.flattenHandlers).toHaveLength(1);
    expect(merged.flattenHandlers[0].behavior).toBe(CustomBehavior.NETWORK_ERROR);
  });

  it("overlays a saved custom response onto a matching handler", () => {
    const id = getRowId({ path: "/a", method: "get" });
    const customResponse = {
      response: '{"cached":true}',
      header: '{"X-Source":"storage"}',
      contentType: MimeType.APPLICATION_JSON,
      status: StringHttpStatusCode.CREATED,
    };
    const merged = mergeStorageData(
      { flattenHandlers: [makeFlatten({ id, path: "/a", method: HttpMethod.GET })] },
      {
        flattenHandlers: [
          makeFlatten({
            id,
            path: "/a",
            method: HttpMethod.GET,
            behavior: CustomBehavior.CUSTOM_RESPONSE,
            customResponse,
          }),
        ],
      },
    );

    expect(merged.flattenHandlers[0]).toMatchObject({
      behavior: CustomBehavior.CUSTOM_RESPONSE,
      customResponse,
    });
  });

  it("keeps incoming handler when there is no saved match", () => {
    const id = getRowId({ path: "/new", method: "get" });
    const incoming = makeFlatten({
      id,
      path: "/new",
      method: HttpMethod.GET,
      behavior: HttpHandlerBehavior.DEFAULT,
    });

    const merged = mergeStorageData({ flattenHandlers: [incoming] }, { flattenHandlers: [] });

    expect(merged.flattenHandlers[0]).toEqual(incoming);
  });

  it("appends saved temp handlers that have rebuildable tempInput", () => {
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
            tempInput: {
              path: "/temp",
              method: HttpMethod.POST,
              contentType: MimeType.APPLICATION_JSON,
              status: StringHttpStatusCode.OK,
              response: "{}",
            },
          }),
        ],
      },
    );

    expect(merged.flattenHandlers.map((h) => h.id)).toEqual([defaultId, tempId]);
    expect(merged.flattenHandlers[1].type).toBe("temp");
  });

  it("skips saved temp handlers without tempInput", () => {
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
          }),
        ],
      },
    );

    expect(merged.flattenHandlers).toHaveLength(1);
    expect(merged.flattenHandlers[0].id).toBe(defaultId);
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
      },
    );

    expect(merged.flattenHandlers).toHaveLength(1);
    expect(merged.flattenHandlers[0].id).toBe(incomingId);
  });
});
