import { http, HttpResponse, HttpResponseResolver } from "msw";
import type { FlattenHandler, HttpHandler, HttpMethod } from "../types";
import { HttpHandlerBehavior } from "../types";
import { isHttpHandler } from "../utils/validate";

export const createHttpHandler = (
  method: HttpMethod,
  path: string,
  resolver: HttpResponseResolver = async () => HttpResponse.json({}),
): HttpHandler => {
  const handler = http[method](path, resolver);
  if (!isHttpHandler(handler)) {
    throw new Error("Expected MSW http handler");
  }
  return handler;
};

export const createFlattenHandler = (
  overrides: Partial<FlattenHandler> & Pick<FlattenHandler, "id" | "path" | "method">,
): FlattenHandler => ({
  handler: createHttpHandler(overrides.method, overrides.path),
  behavior: HttpHandlerBehavior.DEFAULT,
  type: "default",
  ...overrides,
});
