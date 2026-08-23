import { describe, expect, it } from "vitest";
import { HttpMethod, MimeType, StringHttpStatusCode } from "../types";
import { customResponseSchema, isValidHandlerPath, tempHandlerSchema } from "./handler";

const validBase = {
  path: "/api/items",
  method: HttpMethod.GET,
  contentType: MimeType.APPLICATION_JSON,
  status: StringHttpStatusCode.OK,
} as const;

describe("tempHandlerSchema", () => {
  it("accepts a valid payload", () => {
    expect(
      tempHandlerSchema.safeParse({
        ...validBase,
        response: '{"ok":true}',
      }).success,
    ).toBe(true);
  });

  it("rejects invalid JSON response for application/json", () => {
    const result = tempHandlerSchema.safeParse({
      ...validBase,
      response: "{",
    });
    expect(result.success).toBe(false);
  });

  it("accepts MSW path patterns", () => {
    expect(isValidHandlerPath("/users/:id")).toBe(true);
    expect(isValidHandlerPath("/files/*")).toBe(true);
    expect(isValidHandlerPath("not-a-path")).toBe(false);
  });
});

describe("customResponseSchema", () => {
  it("accepts an optional response body, headers, and valid HTTP status", () => {
    expect(
      customResponseSchema.safeParse({
        body: '{"ok":true}',
        headers: { "Content-Type": "application/json" },
        status: 599,
      }).success,
    ).toBe(true);
  });

  it("rejects statuses outside the HTTP response range", () => {
    expect(customResponseSchema.safeParse({ status: 199 }).success).toBe(false);
    expect(customResponseSchema.safeParse({ status: 600 }).success).toBe(false);
    expect(customResponseSchema.safeParse({ status: 200.5 }).success).toBe(false);
  });

  it.each([204, 205, 304])("rejects a body for HTTP %i", (status) => {
    expect(customResponseSchema.safeParse({ status, body: "" }).success).toBe(false);
  });

  it("rejects headers that HttpResponse cannot construct", () => {
    expect(
      customResponseSchema.safeParse({
        headers: { "invalid header": "value" },
      }).success,
    ).toBe(false);
    expect(
      customResponseSchema.safeParse({
        headers: { "X-Test": "line\nbreak" },
      }).success,
    ).toBe(false);
  });
});
