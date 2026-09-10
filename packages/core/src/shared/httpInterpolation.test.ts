import { describe, expect, it } from "vitest";
import { createHttpTemplateContext } from "./httpInterpolation";

const createArgs = (request: Request) => ({
  request,
  requestId: "request-1",
  params: { id: "42" },
  cookies: { locale: "ko" },
});

describe("createHttpTemplateContext", () => {
  it("exposes resolver metadata, query arrays, headers, and JSON body", async () => {
    const context = await createHttpTemplateContext(
      createArgs(
        new Request("https://example.test/items?page=2&tag=a&tag=b", {
          method: "POST",
          headers: {
            Authorization: "Bearer token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: { name: "Ada" } }),
        }),
      ),
    );

    expect(context).toEqual({
      request: {
        url: "https://example.test/items?page=2&tag=a&tag=b",
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json",
        },
        query: { page: "2", tag: ["a", "b"] },
        body: { user: { name: "Ada" } },
      },
      requestId: "request-1",
      params: { id: "42" },
      cookies: { locale: "ko" },
    });
  });

  it("exposes non-JSON request bodies as text and leaves malformed JSON as text", async () => {
    const textContext = await createHttpTemplateContext(
      createArgs(
        new Request("https://example.test/items", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "plain body",
        }),
      ),
    );
    const malformedContext = await createHttpTemplateContext(
      createArgs(
        new Request("https://example.test/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{malformed",
        }),
      ),
    );

    expect(textContext.request).toMatchObject({ body: "plain body", query: {} });
    expect(malformedContext.request).toMatchObject({ body: "{malformed" });
  });

  it("parses a vendor JSON body with media type parameters", async () => {
    const context = await createHttpTemplateContext(
      createArgs(
        new Request("https://example.test/items", {
          method: "POST",
          headers: { "Content-Type": "application/problem+json; charset=utf-8" },
          body: JSON.stringify({ title: "Invalid request" }),
        }),
      ),
    );

    expect(context.request).toMatchObject({ body: { title: "Invalid request" } });
  });

  it("returns an undefined body when the request has no body or its body is unavailable", async () => {
    const emptyRequest = new Request("https://example.test/items");
    const emptyContext = await createHttpTemplateContext(createArgs(emptyRequest));

    const consumedRequest = new Request("https://example.test/items", {
      method: "POST",
      body: "already consumed",
    });
    await consumedRequest.text();
    const consumedContext = await createHttpTemplateContext(createArgs(consumedRequest));

    expect(emptyContext.request).toMatchObject({ body: undefined });
    expect(consumedContext.request).toMatchObject({ body: undefined });
  });
});
