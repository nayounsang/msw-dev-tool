import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "../shared/const";
import { CustomBehavior, HttpHandlerBehavior, HttpMethod } from "../shared/types";
import { getRowId } from "../shared/utils";
import { getBrowserStorageSnapshot, getStorageData, mergeStorageData } from "./storage";
import { createFlattenHandler } from "../shared/testing/createHttpHandler";

describe("getStorageData", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

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
      }),
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
      JSON.stringify({ revision: 7, state: { flattenHandlers: [] } }),
    );
    expect(getBrowserStorageSnapshot()).toEqual({
      revision: 7,
      state: { flattenHandlers: [] },
    });
  });

  it("preserves a persisted custom response", () => {
    const id = getRowId({ path: "/custom", method: "get" });
    const customResponse = {
      body: '{"source":"session"}',
      headers: { "X-Source": "session" },
      status: 202,
    };
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        revision: 3,
        state: {
          flattenHandlers: [
            {
              id,
              path: "/custom",
              method: HttpMethod.GET,
              behavior: CustomBehavior.CUSTOM_RESPONSE,
              type: "default",
              customResponse,
            },
          ],
        },
      }),
    );

    expect(getBrowserStorageSnapshot()).toEqual({
      revision: 3,
      state: {
        flattenHandlers: [
          expect.objectContaining({
            id,
            behavior: CustomBehavior.CUSTOM_RESPONSE,
            customResponse,
          }),
        ],
      },
    });
  });

  it("reports a Zod validation error for an invalid persisted payload", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ revision: "invalid", state: { flattenHandlers: [] } }),
    );

    expect(() => getBrowserStorageSnapshot()).toThrow(
      `Invalid msw-dev-tool sessionStorage payload for key "${STORAGE_KEY}": Expected number, received string`,
    );
  });

  it("reports invalid JSON and supports SSR without sessionStorage", () => {
    sessionStorage.setItem(STORAGE_KEY, "{");
    expect(() => getBrowserStorageSnapshot()).toThrow("invalid JSON");

    vi.stubGlobal("sessionStorage", undefined);
    expect(getBrowserStorageSnapshot()).toEqual({ revision: 0, state: { flattenHandlers: [] } });
    expect(getStorageData()).toEqual({ flattenHandlers: [] });
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
      }),
    );

    const incoming = createFlattenHandler({
      id,
      path: "/a",
      method: HttpMethod.GET,
      behavior: HttpHandlerBehavior.DEFAULT,
      type: "default",
    });

    expect(mergeStorageData({ flattenHandlers: [incoming] }).flattenHandlers[0].behavior).toBe(
      CustomBehavior.NETWORK_ERROR,
    );
  });
});
