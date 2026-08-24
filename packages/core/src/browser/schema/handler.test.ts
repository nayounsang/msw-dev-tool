import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "../../shared/const";
import { HttpMethod, MimeType, StringHttpStatusCode } from "../../shared/types";
import { getRowId } from "../../shared/utils/store";
import * as browserValidate from "../validate";
import { handlerSchema, httpResponseConfigSchema } from "./handler";

const validBase = {
  path: "/api/items",
  method: HttpMethod.GET,
  contentType: MimeType.APPLICATION_JSON,
  status: StringHttpStatusCode.OK,
} as const;

describe("handlerSchema", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a valid payload", () => {
    const result = handlerSchema.safeParse({
      ...validBase,
      response: '{"ok":true}',
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty path", () => {
    const result = handlerSchema.safeParse({
      ...validBase,
      path: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "path")).toBe(true);
    }
  });

  it("rejects invalid header JSON", () => {
    const result = handlerSchema.safeParse({
      ...validBase,
      header: "{",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "header")).toBe(true);
    }
  });

  it("rejects invalid JSON response for application/json", () => {
    const result = handlerSchema.safeParse({
      ...validBase,
      contentType: MimeType.APPLICATION_JSON,
      response: "{",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "response")).toBe(true);
    }
  });

  it("allows missing response body", () => {
    const result = handlerSchema.safeParse({ ...validBase });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate path and method from sessionStorage", () => {
    const id = getRowId({
      path: validBase.path,
      method: validBase.method,
    });
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          flattenHandlers: [
            {
              id,
              path: validBase.path,
              method: validBase.method,
              behavior: "default",
              type: "default",
            },
          ],
        },
      }),
    );

    const result = handlerSchema.safeParse({ ...validBase });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("Duplicate handler"))).toBe(true);
    }
  });

  it("validates XML and HTML response bodies only for their matching content types", () => {
    expect(
      handlerSchema.safeParse({
        ...validBase,
        contentType: MimeType.APPLICATION_XML,
        response: "<item>ok</item>",
      }).success,
    ).toBe(true);
    expect(
      handlerSchema.safeParse({
        ...validBase,
        contentType: MimeType.APPLICATION_XML,
        response: "<item>",
      }).success,
    ).toBe(true);
    expect(
      handlerSchema.safeParse({
        ...validBase,
        contentType: MimeType.TEXT_HTML,
        response: "<main>ok</main>",
      }).success,
    ).toBe(true);
    expect(
      handlerSchema.safeParse({ ...validBase, contentType: MimeType.TEXT_HTML, response: "<main>" })
        .success,
    ).toBe(true);
  });

  it("uses the same browser MIME validation for custom response settings", () => {
    expect(
      httpResponseConfigSchema.safeParse({
        contentType: MimeType.APPLICATION_XML,
        status: StringHttpStatusCode.OK,
        response: "<item>ok</item>",
      }).success,
    ).toBe(true);
    expect(
      httpResponseConfigSchema.safeParse({
        contentType: MimeType.TEXT_HTML,
        status: StringHttpStatusCode.OK,
        response: "<main>ok</main>",
      }).success,
    ).toBe(true);
  });

  it.each([
    [MimeType.APPLICATION_XML, "isValidXml"],
    [MimeType.TEXT_HTML, "isValidHtml"],
  ] as const)("rejects an invalid %s custom response body", (contentType, validator) => {
    vi.spyOn(browserValidate, validator).mockReturnValue(false);

    const result = httpResponseConfigSchema.safeParse({
      contentType,
      status: StringHttpStatusCode.OK,
      response: "invalid markup",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          message: `Invalid response body for ${contentType}`,
          path: ["response"],
        }),
      );
    }
  });
});
