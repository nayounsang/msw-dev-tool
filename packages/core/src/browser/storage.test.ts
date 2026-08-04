import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "../shared/const";
import {
  CustomBehavior,
  HttpHandlerBehavior,
  HttpMethod,
} from "../shared/types";
import { getRowId } from "../shared/utils";
import { getBrowserStorageSnapshot, getStorageData, mergeStorageData } from "./storage";
import { createFlattenHandler } from "../shared/testing/createHttpHandler";

describe("getStorageData", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns empty flattenHandlers when key is missing", () => {
    expect(getStorageData()).toEqual({ flattenHandlers: [] });
  });

  it("parses persisted state from sessionStorage", () => {
    const id = getRowId({ path: "/x", method: "get" });
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          flattenHandlers: [
            {
              id,
              path: "/x",
              method: HttpMethod.GET,
              behavior: CustomBehavior.DISABLE,
              type: "default",
            },
          ],
        },
      })
    );

    expect(getStorageData().flattenHandlers).toEqual([
      {
        id,
        path: "/x",
        method: HttpMethod.GET,
        behavior: CustomBehavior.DISABLE,
        type: "default",
      },
    ]);
    expect(getBrowserStorageSnapshot().revision).toBe(0);
  });

  it("reads the revision from the extended browser payload", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ revision: 7, state: { flattenHandlers: [] } })
    );
    expect(getBrowserStorageSnapshot()).toEqual({
      revision: 7,
      state: { flattenHandlers: [] },
    });
  });

  it("reports a Zod validation error for an invalid persisted payload", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ revision: "invalid", state: { flattenHandlers: [] } })
    );

    expect(() => getBrowserStorageSnapshot()).toThrow(
      `Invalid msw-dev-tool sessionStorage payload for key "${STORAGE_KEY}": Expected number, received string`
    );
  });
});

describe("mergeStorageData", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("merges incoming handlers with sessionStorage-backed saved state", () => {
    const id = getRowId({ path: "/a", method: "get" });
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          flattenHandlers: [
            {
              id,
              path: "/a",
              method: HttpMethod.GET,
              behavior: CustomBehavior.NETWORK_ERROR,
              type: "default",
            },
          ],
        },
      })
    );

    const incoming = createFlattenHandler({
      id,
      path: "/a",
      method: HttpMethod.GET,
      behavior: HttpHandlerBehavior.DEFAULT,
      type: "default",
    });

    expect(
      mergeStorageData({ flattenHandlers: [incoming] }).flattenHandlers[0]
        .behavior
    ).toBe(CustomBehavior.NETWORK_ERROR);
  });
});
