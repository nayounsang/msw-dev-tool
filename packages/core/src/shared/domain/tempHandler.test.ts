import { describe, expect, it, vi } from "vitest";
import { HttpMethod, MimeType, StringHttpStatusCode } from "../types";
import { getRowId } from "../utils/store";
import { buildTempHandler } from "./tempHandler";

describe("buildTempHandler", () => {
  it("builds http handler and flatten entry from input", () => {
    const getBehavior = vi.fn();
    const { handler, flattenHandler } = buildTempHandler(
      {
        path: "/temp",
        method: HttpMethod.POST,
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.OK,
        response: '{"ok":true}',
      },
      getBehavior
    );

    const expectedId = getRowId({ path: "/temp", method: HttpMethod.POST });
    expect(flattenHandler).toMatchObject({
      id: expectedId,
      path: "/temp",
      method: HttpMethod.POST,
      type: "temp",
      behavior: "default",
    });
    expect(flattenHandler.handler).toBe(handler);
    expect(handler.info.path).toBe("/temp");
  });
});
