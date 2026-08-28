import { describe, expect, it, vi } from "vitest";
import { HttpResponse } from "msw";
import { CustomBehavior, HttpMethod, MimeType, StringHttpStatusCode } from "../types";
import { getRowId } from "../utils/store";
import { createHttpHandler } from "../testing/createHttpHandler";
import { wrapHandlersWithBehavior } from "./wrapHandlers";

describe("wrapHandlersWithBehavior", () => {
  it("leaves non-http handlers unchanged", () => {
    const other = { kind: "ws" };
    const getBehavior = vi.fn();
    const result = wrapHandlersWithBehavior([other], getBehavior);
    expect(result[0]).toBe(other);
    expect(getBehavior).not.toHaveBeenCalled();
  });

  it("resolves through injected getBehavior", async () => {
    const id = getRowId({ path: "/x", method: HttpMethod.GET });
    const original = vi.fn(async () => HttpResponse.json({ ok: true }));
    const handler = createHttpHandler(HttpMethod.GET, "/x", original);

    const getBehavior = vi.fn(() => CustomBehavior.RETURN_NULL);
    wrapHandlersWithBehavior([handler], getBehavior);

    const result = await handler.resolver({
      request: new Request("http://localhost/x"),
      requestId: "1",
      params: {},
      cookies: {},
    });

    expect(getBehavior).toHaveBeenCalledWith(id);
    expect(original).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      throw new Error("Expected Response");
    }
    expect(await result.json()).toBeNull();
  });

  it("falls through to original resolver for default behavior", async () => {
    const original = vi.fn(async () => HttpResponse.json({ ok: true }));
    const handler = createHttpHandler(HttpMethod.GET, "/x", original);

    wrapHandlersWithBehavior([handler], () => CustomBehavior.DEFAULT);
    await handler.resolver({
      request: new Request("http://localhost/x"),
      requestId: "1",
      params: {},
      cookies: {},
    });
    expect(original).toHaveBeenCalledOnce();
  });

  it("passes through when either HTTP or global mocking is disabled, without losing behavior", async () => {
    const original = vi.fn(async () => HttpResponse.json({ original: true }));
    const handler = createHttpHandler(HttpMethod.GET, "/x", original);
    let handlerEnabled = false;
    let mockEnabled = true;
    wrapHandlersWithBehavior(
      [handler],
      () => CustomBehavior.RETURN_NULL,
      () => undefined,
      () => handlerEnabled,
      () => mockEnabled,
    );
    const args = {
      request: new Request("http://localhost/x"),
      requestId: "1",
      params: {},
      cookies: {},
    };

    await handler.resolver(args);
    mockEnabled = false;
    handlerEnabled = true;
    await handler.resolver(args);
    expect(original).not.toHaveBeenCalled();

    mockEnabled = true;
    const result = await handler.resolver(args);
    expect(original).not.toHaveBeenCalled();
    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(await result.json()).toBeNull();
  });

  it("uses the custom response for a code-defined handler", async () => {
    const handler = createHttpHandler(HttpMethod.GET, "/x");
    wrapHandlersWithBehavior(
      [handler],
      () => CustomBehavior.CUSTOM_RESPONSE,
      () => ({
        contentType: MimeType.TEXT_PLAIN,
        response: "custom",
        header: '{"X-Handler":"yes"}',
        status: StringHttpStatusCode.ACCEPTED,
      }),
    );

    const result = await handler.resolver({
      request: new Request("http://localhost/x"),
      requestId: "1",
      params: {},
      cookies: {},
    });

    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(result.status).toBe(202);
    expect(result.headers.get("X-Handler")).toBe("yes");
    expect(await result.text()).toBe("custom");
  });

  it("preserves network-error behavior from the original resolver", async () => {
    const networkError = HttpResponse.error();
    const handler = createHttpHandler(HttpMethod.GET, "/x", async () => networkError);

    wrapHandlersWithBehavior([handler], () => CustomBehavior.DEFAULT);
    const result = await handler.resolver({
      request: new Request("http://localhost/x"),
      requestId: "1",
      params: {},
      cookies: {},
    });

    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      throw new Error("Expected Response");
    }
    expect(result.type).toBe("error");
    expect(result.status).toBe(0);
  });

  it("normalizes empty and native Response resolver results", async () => {
    const empty = createHttpHandler(HttpMethod.GET, "/empty", async () => undefined);
    const native = createHttpHandler(
      HttpMethod.GET,
      "/native",
      async () => new Response("native", { status: 201 }),
    );
    wrapHandlersWithBehavior([empty, native], () => CustomBehavior.DEFAULT);
    const args = {
      request: new Request("http://localhost/x"),
      requestId: "1",
      params: {},
      cookies: {},
    };
    const emptyResult = await empty.resolver(args);
    const nativeResult = await native.resolver(args);
    expect(emptyResult).toBeUndefined();
    expect(nativeResult).toBeInstanceOf(Response);
    if (nativeResult instanceof Response) expect(await nativeResult.text()).toBe("native");
  });
});
