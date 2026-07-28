import { describe, expect, it, vi } from "vitest";
import { HttpResponse } from "msw";
import { CustomBehavior } from "../types";
import { getRowId } from "../utils/store";
import type { HttpHandler } from "../types";
import { wrapHandlersWithBehavior } from "./wrapHandlers";

describe("wrapHandlersWithBehavior", () => {
  it("leaves non-http handlers unchanged", () => {
    const other = { kind: "ws" } as unknown as HttpHandler;
    const getBehavior = vi.fn();
    const result = wrapHandlersWithBehavior([other as never], getBehavior);
    expect(result[0]).toBe(other);
    expect(getBehavior).not.toHaveBeenCalled();
  });

  it("resolves through injected getBehavior", async () => {
    const id = getRowId({ path: "/x", method: "GET" });
    const original = vi.fn(async () => HttpResponse.json({ ok: true }));
    const handler = {
      info: { method: "GET", path: "/x" },
      resolver: original,
    } as unknown as HttpHandler;

    const getBehavior = vi.fn(() => CustomBehavior.RETURN_NULL);
    wrapHandlersWithBehavior([handler], getBehavior);

    const result = (await handler.resolver({} as never)) as Response;
    expect(getBehavior).toHaveBeenCalledWith(id);
    expect(original).not.toHaveBeenCalled();
    expect(await result.json()).toBeNull();
  });

  it("falls through to original resolver for default behavior", async () => {
    const original = vi.fn(async () => HttpResponse.json({ ok: true }));
    const handler = {
      info: { method: "GET", path: "/x" },
      resolver: original,
    } as unknown as HttpHandler;

    wrapHandlersWithBehavior([handler], () => CustomBehavior.DEFAULT);
    await handler.resolver({} as never);
    expect(original).toHaveBeenCalledOnce();
  });
});
