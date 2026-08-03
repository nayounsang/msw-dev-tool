import { describe, expect, it } from "vitest";
import {
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "../types";
import { tempHandlerSchema, isValidHandlerPath } from "./handler";

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
      }).success
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
