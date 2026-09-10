import { describe, expect, it, vi } from "vitest";
import { HttpResponse } from "msw";
import {
  CustomBehavior,
  HttpErrorStatusCode,
  MimeType,
  STANDARD_HTTP_STATUS_TEXT,
  StringHttpStatusCode,
} from "../types";
import { createHttpResponseFromConfig, getHandlerResponseByBehavior } from "./handler";

vi.mock("msw", async (importOriginal) => {
  const actual = await importOriginal<typeof import("msw")>();
  return {
    ...actual,
    delay: vi.fn(async () => undefined),
  };
});

describe("getHandlerResponseByBehavior", () => {
  const context = {
    request: {
      body: { id: 'a"b' },
      headers: { "x-request-value": "yes" },
      method: "GET",
      query: { page: "2" },
      url: "https://example.test/items?page=2",
    },
    requestId: "request-1",
    params: { id: "42" },
    cookies: { locale: "ko" },
  };

  it("creates an empty JSON response with its default metadata", async () => {
    const result = await createHttpResponseFromConfig({
      contentType: MimeType.APPLICATION_JSON,
      status: "299",
    });

    expect(result.status).toBe(299);
    expect(result.statusText).toBe("");
    expect(result.headers.get("Content-Length")).toBe("0");
    expect(await result.text()).toBe("");
  });

  it("calls original resolver when behavior is undefined or DEFAULT", async () => {
    const original = vi.fn(async () => HttpResponse.json({ ok: true }));

    await getHandlerResponseByBehavior(undefined, original);
    await getHandlerResponseByBehavior(CustomBehavior.DEFAULT, original);

    expect(original).toHaveBeenCalledTimes(2);
  });

  it("falls back to the original resolver for an unknown behavior", async () => {
    const original = vi.fn(async () => HttpResponse.json({}));
    await getHandlerResponseByBehavior("disable mock", original);
    expect(original).toHaveBeenCalledOnce();
  });

  it("awaits delay and returns empty Response for DELAY", async () => {
    const { delay } = await import("msw");
    const result = await getHandlerResponseByBehavior(CustomBehavior.DELAY, async () =>
      HttpResponse.json({}),
    );

    expect(delay).toHaveBeenCalledWith("infinite");
    expect(result).toBeInstanceOf(Response);
  });

  it("returns null JSON body for RETURN_NULL", async () => {
    const result = await getHandlerResponseByBehavior(CustomBehavior.RETURN_NULL, async () =>
      HttpResponse.json({ shouldNot: true }),
    );

    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      throw new Error("Expected Response");
    }
    expect(result.status).toBe(200);
    expect(await result.json()).toBeNull();
  });

  it("returns network error for NETWORK_ERROR", async () => {
    const result = await getHandlerResponseByBehavior(CustomBehavior.NETWORK_ERROR, async () =>
      HttpResponse.json({}),
    );
    expect(result).toEqual(HttpResponse.error());
  });

  it("returns the configured custom response", async () => {
    const result = await getHandlerResponseByBehavior(
      CustomBehavior.CUSTOM_RESPONSE,
      async () => HttpResponse.json({ original: true }),
      {
        response: '{"custom":true}',
        header: '{"X-Source":"dev-tool"}',
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.CREATED,
      },
    );

    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(result.status).toBe(201);
    expect(result.statusText).toBe("Created");
    expect(result.headers.get("X-Source")).toBe("dev-tool");
    expect(await result.text()).toBe('{"custom":true}');
  });

  it("uses configured status text when provided", async () => {
    const result = await getHandlerResponseByBehavior(
      CustomBehavior.CUSTOM_RESPONSE,
      async () => HttpResponse.json({ original: true }),
      {
        response: "custom status",
        contentType: MimeType.TEXT_PLAIN,
        status: StringHttpStatusCode.OK,
        statusText: "Custom OK",
      },
    );

    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(result.status).toBe(200);
    expect(result.statusText).toBe("Custom OK");
  });

  it("renders request values in custom response bodies and headers", async () => {
    const result = await getHandlerResponseByBehavior(
      CustomBehavior.CUSTOM_RESPONSE,
      async () => HttpResponse.json({ original: true }),
      {
        response:
          '{"id":${{params.id}},"name":"${{request.body.id}}","page":"${{request.query.page}}"}',
        header: '{"X-Request-ID":"${{requestId}}","X-Locale":"${{cookies.locale}}"}',
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.OK,
      },
      context,
    );

    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(await result.json()).toEqual({ id: "42", name: 'a"b', page: "2" });
    expect(result.headers.get("X-Request-ID")).toBe("request-1");
    expect(result.headers.get("X-Locale")).toBe("ko");
  });

  it("removes unsafe control characters from a rendered response header", async () => {
    const result = await createHttpResponseFromConfig(
      {
        contentType: MimeType.TEXT_PLAIN,
        header: '{"X-Query":"${{request.query.q}}"}',
        status: StringHttpStatusCode.OK,
      },
      {
        ...context,
        request: { ...context.request, query: { q: "before\nafter\u0000end" } },
      },
    );

    expect(result.headers.get("X-Query")).toBe("before after end");
  });

  it("preserves a static JSON response when a resolver context is present", async () => {
    const response = '{\n  "ok": true\n}';
    const result = await createHttpResponseFromConfig(
      {
        contentType: MimeType.APPLICATION_JSON,
        response,
        status: StringHttpStatusCode.OK,
      },
      context,
    );

    expect(await result.text()).toBe(response);
  });

  it("throws when CUSTOM_RESPONSE has not been configured", async () => {
    await expect(
      getHandlerResponseByBehavior(CustomBehavior.CUSTOM_RESPONSE, async () =>
        HttpResponse.json({}),
      ),
    ).rejects.toThrow("Please configure a custom response before using this behavior.");
  });

  it.each([
    [HttpErrorStatusCode.NOT_FOUND, "Not Found"],
    [HttpErrorStatusCode.SERVICE_UNAVAILABLE, "Service Unavailable"],
  ])("returns the standard status text for error behavior %i", async (status, statusText) => {
    const result = await getHandlerResponseByBehavior(status, async () => HttpResponse.json({}));

    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      throw new Error("Expected Response");
    }
    expect(result.status).toBe(status);
    expect(result.statusText).toBe(statusText);
  });

  it("exports standard status messages from the shared HTTP constants", () => {
    expect(STANDARD_HTTP_STATUS_TEXT).toMatchObject({
      200: "OK",
      404: "Not Found",
      503: "Service Unavailable",
    });
  });

  it("includes the 305 standard status text", () => {
    expect(STANDARD_HTTP_STATUS_TEXT[305]).toBe("Use Proxy");
  });

  it("falls back to original resolver for unknown behavior", async () => {
    const original = vi.fn(async () => HttpResponse.json({ fallback: true }));
    await getHandlerResponseByBehavior("unknown", original);
    expect(original).toHaveBeenCalledOnce();
  });
});
