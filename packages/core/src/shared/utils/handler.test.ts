import { describe, expect, it, vi } from "vitest";
import { HttpResponse, passthrough } from "msw";
import { CustomBehavior, HttpErrorStatusCode } from "../types";
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
    const result = await getHandlerResponseByBehavior(
      CustomBehavior.DISABLE,
      async () => HttpResponse.json({})
    );
    expect(result).toEqual(passthrough());
  });

  it("awaits delay and returns empty Response for DELAY", async () => {
    const { delay } = await import("msw");
    const result = await getHandlerResponseByBehavior(
      CustomBehavior.DELAY,
      async () => HttpResponse.json({})
    );

    expect(delay).toHaveBeenCalledWith("infinite");
    expect(result).toBeInstanceOf(Response);
  });

  it("returns null JSON body for RETURN_NULL", async () => {
    const result = (await getHandlerResponseByBehavior(
      CustomBehavior.RETURN_NULL,
      async () => HttpResponse.json({ shouldNot: true })
    )) as Response;

    expect(result.status).toBe(200);
    expect(await result.json()).toBeNull();
  });

  it("returns network error for NETWORK_ERROR", async () => {
    const result = await getHandlerResponseByBehavior(
      CustomBehavior.NETWORK_ERROR,
      async () => HttpResponse.json({})
    );
    expect(result).toEqual(HttpResponse.error());
  });

  it("returns HttpResponse with status for error status codes", async () => {
    const result = (await getHandlerResponseByBehavior(
      HttpErrorStatusCode.NOT_FOUND,
      async () => HttpResponse.json({})
    )) as Response;

    expect(result.status).toBe(404);
    expect(result.statusText).toContain("404");
  });

  it("falls back to original resolver for unknown behavior", async () => {
    const original = vi.fn(async () => HttpResponse.json({ fallback: true }));
    await getHandlerResponseByBehavior("unknown" as never, original);
    expect(original).toHaveBeenCalledOnce();
  });
});
