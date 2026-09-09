import { describe, expect, it } from "vitest";
import { interpolateJson, interpolateText, isValidJsonTemplate } from "./interpolation";

const context = {
  request: {
    method: "POST",
    url: "https://example.test/items?page=2",
    query: { page: "2", tag: ["one", "two"] },
    headers: { authorization: "Bearer token" },
    body: { name: 'Ada "Lovelace"', active: true },
  },
  requestId: "request-1",
  params: { id: "42" },
  cookies: { locale: "ko" },
};

describe("interpolateText", () => {
  it("renders allowed resolver values through dot paths", () => {
    expect(
      interpolateText(
        "${{params.id}}/${{request.query.page}}/${{request.query.tag}}/${{cookies.locale}}/${{requestId}}",
        context,
      ),
    ).toBe('42/2/["one","two"]/ko/request-1');
  });

  it("renders request metadata, headers, and nested JSON body values", () => {
    expect(
      interpolateText(
        "${{request.method}} ${{request.url}} ${{request.headers.authorization}} ${{request.body.name}}",
        context,
      ),
    ).toBe('POST https://example.test/items?page=2 Bearer token Ada "Lovelace"');
  });

  it("stringifies primitive and non-serializable values", () => {
    expect(
      interpolateText("${{request.body.active}} ${{params.count}} ${{params.nil}} ${{params.fn}}", {
        ...context,
        params: { count: 2, nil: null, fn: () => undefined },
      }),
    ).toBe("true 2 null () => undefined");
  });

  it("keeps unsupported or missing paths unchanged", () => {
    expect(
      interpolateText("${{req.id}} ${{params.missing}} ${{request.body.missing}} ${{}}", context),
    ).toBe("${{req.id}} ${{params.missing}} ${{request.body.missing}} ${{}}");
  });
});

describe("interpolateJson", () => {
  it("escapes values inserted into JSON strings", () => {
    const output = interpolateJson('{"name":"${{request.body.name}}"}', context);
    expect(JSON.parse(output)).toEqual({ name: 'Ada "Lovelace"' });
  });

  it("inserts complete JSON values with their original types", () => {
    const output = interpolateJson(
      '{"id":${{params.id}},"body":${{request.body}},"missing":"${{params.none}}"}',
      context,
    );
    expect(JSON.parse(output)).toEqual({
      id: "42",
      body: context.request.body,
      missing: "${{params.none}}",
    });
  });

  it("keeps quoted primitive and compound values as JSON strings", () => {
    const output = interpolateJson(
      '{"count":"${{request.body.count}}","active":"${{request.body.active}}","tags":"${{request.body.tags}}","body":"${{request.body}}"}',
      {
        ...context,
        request: {
          ...context.request,
          body: { count: 2, active: true, tags: ["one", "two"], user: { id: 1 } },
        },
      },
    );

    expect(JSON.parse(output)).toEqual({
      count: "2",
      active: "true",
      tags: '["one","two"]',
      body: '{"count":2,"active":true,"tags":["one","two"],"user":{"id":1}}',
    });
  });

  it("renders multiple tokens and object values inside a JSON string", () => {
    const output = interpolateJson(
      '{"message":"id=${{params.id}} body=${{request.body}}"}',
      context,
    );
    expect(JSON.parse(output)).toEqual({
      message: 'id=42 body={"name":"Ada \\"Lovelace\\"","active":true}',
    });
  });

  it("renders tokens in JSON arrays and preserves escaped static strings", () => {
    const output = interpolateJson(
      '{"items":[${{params.id}},"escaped \\"text\\"", "${{params.id}}"]}',
      context,
    );
    expect(JSON.parse(output)).toEqual({ items: ["42", 'escaped "text"', "42"] });
  });

  it("preserves non-string JSON values while rendering a sibling token", () => {
    const output = interpolateJson('{"enabled":true,"id":"${{params.id}}"}', context);
    expect(JSON.parse(output)).toEqual({ enabled: true, id: "42" });
  });

  it("renders tokens in JSON object keys", () => {
    const output = interpolateJson('{"${{params.id}}":"value"}', context);
    expect(JSON.parse(output)).toEqual({ 42: "value" });
  });

  it("keeps a static value that matches the initial internal marker", () => {
    const output = interpolateJson(
      '{"static":"__MSW_DEV_TOOL_TEMPLATE_0__","id":"${{params.id}}"}',
      context,
    );
    expect(JSON.parse(output)).toEqual({ static: "__MSW_DEV_TOOL_TEMPLATE_0__", id: "42" });
  });

  it("leaves an unterminated marker untouched while validating the surrounding JSON", () => {
    expect(isValidJsonTemplate('{"value":"${{params.id}"}')).toBe(true);
    expect(interpolateJson('{"value":"${{params.id}"}', context)).toBe('{"value":"${{params.id}"}');
  });
});

describe("isValidJsonTemplate", () => {
  it("accepts valid JSON containing string and value placeholders", () => {
    expect(isValidJsonTemplate('{"id":${{params.id}},"name":"${{params.name}}"}')).toBe(true);
  });

  it("rejects malformed JSON and mixed raw value text", () => {
    expect(isValidJsonTemplate('{"id":${{params.id}}-suffix}')).toBe(false);
    expect(isValidJsonTemplate('{"id":')).toBe(false);
  });
});
