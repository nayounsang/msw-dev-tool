import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

vi.mock("msw/browser", () => ({
  setupWorker: (...handlers: unknown[]) => ({
    listHandlers: () => handlers,
    use: () => undefined,
    resetHandlers: () => undefined,
  }),
}));

import { BROWSER_CONTROL_KEY, BrowserControlBridge, handlerStore, setupDevToolWorker } from "./handlerStore";
import { STORAGE_KEY } from "../shared/const";
import { BROWSER_CONTROL_METHOD_VERSIONS } from "../shared/controlProtocol";

const getBridge = (): BrowserControlBridge => {
  const bridge = window[BROWSER_CONTROL_KEY];
  if (!bridge) throw new Error("Browser control bridge was not registered");
  return bridge;
};

describe("browser control bridge", () => {
  beforeEach(() => sessionStorage.clear());

  it("persists each bridge state transition and restores code handlers on reset", async () => {
    await setupDevToolWorker(http.get("/bridge-handler", () => HttpResponse.json({ ok: true })));
    const bridge = getBridge();
    expect(bridge).toMatchObject({
      version: 2,
      methods: BROWSER_CONTROL_METHOD_VERSIONS,
    });
    const handler = bridge.list()[0];
    const initialRevision = bridge.describe().revision;

    const changed = bridge.setBehavior(handler.id, "delay");
    const tempInput = {
      path: "/bridge-temp",
      method: "get",
      contentType: "application/json",
      status: "200",
      response: "{\"ok\":true}",
    } as const;
    const additions = await Promise.allSettled([
      Promise.resolve().then(() => bridge.addTemp(tempInput)),
      Promise.resolve().then(() => bridge.addTemp(tempInput)),
    ]);
    const added = additions.find(
      (result): result is PromiseFulfilledResult<{ revision: number; handlerCount: number }> =>
        result.status === "fulfilled"
    );

    expect(bridge.get(handler.id)).toMatchObject({ behavior: "delay" });
    expect(changed).toMatchObject({ revision: initialRevision + 1, handler: { id: handler.id, behavior: "delay" } });
    expect(added?.value).toMatchObject({ revision: initialRevision + 2, handler: { type: "temp" } });
    expect(additions.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(bridge.list()).toHaveLength(2);

    const removed = bridge.removeTemp('{"path":"/bridge-temp","method":"get"}');
    const reset = bridge.reset();

    expect(removed.revision).toBe(initialRevision + 3);
    expect(reset.revision).toBe(initialRevision + 4);
    expect(bridge.list()).toEqual([expect.objectContaining({ id: handler.id, behavior: "default", type: "default" })]);
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      revision: reset.revision,
      state: { flattenHandlers: [{ id: handler.id, behavior: "default" }] },
    });
  });

  it("exposes custom response configuration through the handler store", async () => {
    await setupDevToolWorker(http.get("/custom", () => HttpResponse.json({ original: true })));
    const handler = handlerStore.getState().flattenHandlers[0]!;
    const customResponse = {
      body: "custom body",
      headers: { "X-Custom": "yes" },
      status: 202,
    };

    const changed = getBridge().setCustomResponse(handler.id, customResponse);
    handlerStore.getState().setHandlerBehavior(handler.id, "custom response");

    expect(handlerStore.getState().getHandlerCustomResponse(handler.id)).toEqual(customResponse);
    expect(changed.handler).toMatchObject({ id: handler.id, behavior: "default", customResponse });
    const result = await handler.handler.resolver({
      request: new Request("http://localhost/custom"),
      requestId: "1",
      params: {},
      cookies: {},
    });
    if (!(result instanceof Response)) throw new Error("Expected Response");
    expect(result.status).toBe(202);
    expect(result.headers.get("X-Custom")).toBe("yes");
    expect(await result.text()).toBe("custom body");
  });
});
