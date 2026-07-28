import { describe, expect, it } from "vitest";
import { HttpResponse } from "msw";
import { HttpHandlerBehavior } from "../types";
import {
  convertHandlers,
  getObjFromRowId,
  getRowId,
  initMSWDevToolStore,
} from "./store";
import type { Handler, HttpHandler } from "../types";

const makeHttpHandler = (method: string, path: string): HttpHandler =>
  ({
    info: { method, path },
    resolver: async () => HttpResponse.json({}),
  }) as unknown as HttpHandler;

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
    const http = makeHttpHandler("GET", "/ok");
    const { flattenHandlers, unsupportedHandlers } = convertHandlers([http]);

    expect(unsupportedHandlers).toEqual([]);
    expect(flattenHandlers).toEqual([
      {
        id: getRowId({ path: "/ok", method: "GET" }),
        path: "/ok",
        method: "GET",
        handler: http,
        behavior: HttpHandlerBehavior.DEFAULT,
        type: "default",
      },
    ]);
  });

  it("collects non-http handlers as unsupported", () => {
    const http = makeHttpHandler("POST", "/items");
    const unsupported = { kind: "ws" } as unknown as Handler;
    const { flattenHandlers, unsupportedHandlers } = convertHandlers([
      http,
      unsupported,
    ]);

    expect(flattenHandlers).toHaveLength(1);
    expect(unsupportedHandlers).toEqual([unsupported]);
  });
});

describe("initMSWDevToolStore", () => {
  it("builds flatten state from a listHandlers runtime", () => {
    const http = makeHttpHandler("POST", "/items");
    const runtime = { listHandlers: () => [http] };

    const result = initMSWDevToolStore(runtime);

    expect(result.worker).toBe(runtime);
    expect(result.flattenHandlers).toHaveLength(1);
    expect(result.flattenHandlers[0].method).toBe("POST");
    expect(result.unsupportedHandlers).toEqual([]);
  });
});
