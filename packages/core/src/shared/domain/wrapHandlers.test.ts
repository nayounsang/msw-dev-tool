import { describe, expect, it, vi } from "vitest";
import { HttpResponse } from "msw";
import { CustomBehavior, HttpMethod } from "../types";
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

  it("preserves network-error behavior from the original resolver", async () => {
    const networkError = HttpResponse.error();
    const handler = createHttpHandler(
      HttpMethod.GET,
      "/x",
      async () => networkError
    );

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
});
