import { describe, expect, it } from "vitest";
import { HttpMethod, MimeType, StringHttpStatusCode } from "../types";
import { httpResponseConfigSchema, isValidHandlerPath, tempHandlerSchema } from "./handler";

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

describe("httpResponseConfigSchema", () => {
  it("accepts body, headers, delay, content type, and status", () => {
    expect(
      httpResponseConfigSchema.safeParse({
        response: '{"ok":true}',
        header: '{"X-Test":"yes"}',
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.ACCEPTED,
        delay: 10,
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported statuses", () => {
    expect(
      httpResponseConfigSchema.safeParse({
        ...validBase,
        path: undefined,
        method: undefined,
        status: "599",
      }).success,
    ).toBe(false);
  });

  it("rejects a body for HTTP 204", () => {
    expect(
      httpResponseConfigSchema.safeParse({
        contentType: MimeType.TEXT_PLAIN,
        status: StringHttpStatusCode.NO_CONTENT,
        response: "",
      }).success,
    ).toBe(false);
  });

  it("rejects headers that HttpResponse cannot construct", () => {
    expect(
      httpResponseConfigSchema.safeParse({
        contentType: MimeType.TEXT_PLAIN,
        status: StringHttpStatusCode.OK,
        header: '{"invalid header":"value"}',
      }).success,
    ).toBe(false);
    expect(
      httpResponseConfigSchema.safeParse({
        contentType: MimeType.TEXT_PLAIN,
        status: StringHttpStatusCode.OK,
        header: '{"X-Test":"line\\nbreak"}',
      }).success,
    ).toBe(false);
  });
});
