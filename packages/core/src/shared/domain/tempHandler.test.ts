import { describe, expect, it, vi } from "vitest";
import {
  CustomBehavior,
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "../types";
import { getRowId } from "../utils/store";
import { createFlattenHandler } from "../testing/createHttpHandler";
import { buildTempHandler, rehydrateTempHandlers } from "./tempHandler";

const baseInput = {
  path: "/temp",
  method: HttpMethod.POST,
  contentType: MimeType.APPLICATION_JSON,
  status: StringHttpStatusCode.OK,
  response: '{"ok":true}',
} as const;

describe("buildTempHandler", () => {
  it("builds http handler and flatten entry from input", () => {
    const getBehavior = vi.fn();
    const { handler, flattenHandler } = buildTempHandler(
      baseInput,
      getBehavior
    );

    const expectedId = getRowId({ path: "/temp", method: HttpMethod.POST });
    expect(flattenHandler).toMatchObject({
      id: expectedId,
      path: "/temp",
      method: HttpMethod.POST,
      type: "temp",
      behavior: "default",
      tempInput: baseInput,
    });
    expect(flattenHandler.handler).toBe(handler);
    expect(handler.info.path).toBe("/temp");
  });

  it("returns a fresh response body on each resolver call", async () => {
    const getBehavior = vi.fn(() => CustomBehavior.DEFAULT);
    const { handler } = buildTempHandler(baseInput, getBehavior);

    const first = await handler.resolver({
      request: new Request("http://localhost/temp", { method: "POST" }),
      requestId: "1",
      params: {},
      cookies: {},
    });
    const second = await handler.resolver({
      request: new Request("http://localhost/temp", { method: "POST" }),
      requestId: "2",
      params: {},
      cookies: {},
    });

    expect(first).toBeInstanceOf(Response);
    expect(second).toBeInstanceOf(Response);
    expect(first).not.toBe(second);

    if (!(first instanceof Response) || !(second instanceof Response)) {
      throw new Error("Expected Response instances");
    }

    expect(await first.text()).toBe('{"ok":true}');
    expect(await second.text()).toBe('{"ok":true}');
  });

  it("uses the configured custom response", async () => {
    const { handler } = buildTempHandler(
      baseInput,
      () => CustomBehavior.CUSTOM_RESPONSE,
      () => ({ body: "temporary custom", headers: { "X-Temp": "yes" }, status: 202 })
    );

    const result = await handler.resolver({
      request: new Request("http://localhost/temp", { method: "POST" }),
      requestId: "1",
      params: {},
      cookies: {},
    });

    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(result.status).toBe(202);
    expect(result.headers.get("X-Temp")).toBe("yes");
    expect(await result.text()).toBe("temporary custom");
  });

  it("supports every HTTP method when constructing temporary handlers", () => {
    for (const method of Object.values(HttpMethod)) {
      const { handler } = buildTempHandler({ ...baseInput, method });
      expect(handler.info.method.toLowerCase()).toBe(method);
    }
  });

  it("uses empty content length and optional headers for non-JSON responses", async () => {
    const { handler } = buildTempHandler({ ...baseInput, contentType: MimeType.TEXT_PLAIN, response: "", header: '{"X-Test":"yes"}' }, () => CustomBehavior.DEFAULT);
    const result = await handler.resolver({ request: new Request("http://localhost/temp"), requestId: "1", params: {}, cookies: {} });
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.headers.get("Content-Length")).toBeNull();
      expect(result.headers.get("X-Test")).toBe("yes");
    }
  });
});

describe("rehydrateTempHandlers", () => {
  it("rebuilds temp handlers from tempInput and drops broken temps", () => {
    const getBehavior = vi.fn();
    const defaultId = getRowId({ path: "/a", method: "get" });
    const tempId = getRowId({ path: "/temp", method: HttpMethod.POST });

    const result = rehydrateTempHandlers(
      [
        createFlattenHandler({
          id: defaultId,
          path: "/a",
          method: HttpMethod.GET,
          type: "default",
          behavior: CustomBehavior.DEFAULT,
        }),
        createFlattenHandler({
          id: tempId,
          path: "/temp",
          method: HttpMethod.POST,
          type: "temp",
          behavior: CustomBehavior.DISABLE,
          tempInput: baseInput,
        }),
        createFlattenHandler({
          id: "broken",
          path: "/broken",
          method: HttpMethod.GET,
          type: "temp",
          behavior: CustomBehavior.DEFAULT,
        }),
      ],
      getBehavior
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(defaultId);
    expect(result[1].id).toBe(tempId);
    expect(result[1].behavior).toBe(CustomBehavior.DISABLE);
    expect(typeof result[1].handler.resolver).toBe("function");
  });

  it("drops persisted non-temporary entries that have no runtime handler", () => {
    expect(rehydrateTempHandlers([
      { id: "persisted", path: "/persisted", method: HttpMethod.GET, behavior: CustomBehavior.DEFAULT, type: "default" },
    ], () => CustomBehavior.DEFAULT)).toEqual([]);
  });
});
