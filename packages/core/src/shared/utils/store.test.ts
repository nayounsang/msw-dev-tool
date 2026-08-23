import { describe, expect, it } from "vitest";
import { HttpResponse } from "msw";
import { HttpHandlerBehavior, HttpMethod } from "../types";
import { convertHandlers, getObjFromRowId, getRowId, initMSWDevToolStore } from "./store";
import { createHttpHandler } from "../testing/createHttpHandler";

describe("getRowId / getObjFromRowId", () => {
  it("encodes and decodes path and method", () => {
    const id = getRowId({ path: "/api/users", method: "get" });
    expect(getObjFromRowId(id)).toEqual({
      path: "/api/users",
      method: "get",
    });
  });
});

describe("convertHandlers", () => {
  it("flattens http handlers with default behavior and type", () => {
    const httpHandler = createHttpHandler(HttpMethod.GET, "/ok");
    const { flattenHandlers, unsupportedHandlers } = convertHandlers([httpHandler]);

    expect(unsupportedHandlers).toEqual([]);
    expect(flattenHandlers).toEqual([
      {
        id: getRowId({ path: "/ok", method: HttpMethod.GET }),
        path: "/ok",
        method: HttpMethod.GET,
        handler: httpHandler,
        behavior: HttpHandlerBehavior.DEFAULT,
        type: "default",
      },
    ]);
  });

  it("collects non-http handlers as unsupported", () => {
    const httpHandler = createHttpHandler(HttpMethod.POST, "/items");
    const unsupported = { kind: "ws" };
    const { flattenHandlers, unsupportedHandlers } = convertHandlers([httpHandler, unsupported]);

    expect(flattenHandlers).toHaveLength(1);
    expect(unsupportedHandlers).toEqual([unsupported]);
  });

  it("normalizes uppercase MSW methods to HttpMethod", () => {
    const handler = {
      info: { method: "GET", path: "/upper" },
      resolver: async () => HttpResponse.json({}),
    };
    const { flattenHandlers } = convertHandlers([handler]);
    expect(flattenHandlers[0].method).toBe(HttpMethod.GET);
    expect(flattenHandlers[0].id).toBe(getRowId({ path: "/upper", method: HttpMethod.GET }));
  });
});

describe("initMSWDevToolStore", () => {
  it("builds flatten state from a listHandlers runtime", () => {
    const httpHandler = createHttpHandler(HttpMethod.POST, "/items");
    const runtime = { listHandlers: () => [httpHandler] };

    const result = initMSWDevToolStore(runtime);

    expect(result.worker).toBe(runtime);
    expect(result.flattenHandlers).toHaveLength(1);
    expect(result.flattenHandlers[0].method).toBe(HttpMethod.POST);
    expect(result.unsupportedHandlers).toEqual([]);
  });
});
