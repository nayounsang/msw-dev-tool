import { describe, expect, it, vi } from "vitest";
import { HttpResponse, passthrough } from "msw";
import {
  CustomBehavior,
  HttpErrorStatusCode,
  MimeType,
  STANDARD_HTTP_STATUS_TEXT,
  StringHttpStatusCode,
} from "../types";
import { getHandlerResponseByBehavior } from "./handler";

vi.mock("msw", async (importOriginal) => {
  const actual = await importOriginal<typeof import("msw")>();
  return {
    ...actual,
    delay: vi.fn(async () => undefined),
  };
});

describe("getHandlerResponseByBehavior", () => {
  it("calls original resolver when behavior is undefined or DEFAULT", async () => {
    const original = vi.fn(async () => HttpResponse.json({ ok: true }));

    await getHandlerResponseByBehavior(undefined, original);
    await getHandlerResponseByBehavior(CustomBehavior.DEFAULT, original);

    expect(original).toHaveBeenCalledTimes(2);
  });

  it("returns passthrough for DISABLE", async () => {
    const result = await getHandlerResponseByBehavior(CustomBehavior.DISABLE, async () =>
      HttpResponse.json({}),
    );
    expect(result).toEqual(passthrough());
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
