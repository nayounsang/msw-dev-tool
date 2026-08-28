import { HttpHandler as MswHttpHandler, HttpMethods, passthrough } from "msw";
import {
  FlattenHandler,
  HttpResponseConfig,
  HttpHandler,
  HttpHandlerBehavior,
  HttpMethod,
  TempHandlerInput,
} from "../types";
import type { HydratableFlattenHandler } from "../utils/storage";
import { createHttpResponseFromConfig, getHandlerResponseByBehavior } from "../utils/handler";
import { getRowId } from "../utils/store";
import { isHttpHandler } from "../utils/validate";

export type { TempHandlerInput };

const isRuntimeFlattenHandler = (handler: HydratableFlattenHandler): handler is FlattenHandler =>
  "handler" in handler;

const toMswMethod = (method: HttpMethod): HttpMethods => {
  switch (method) {
    case HttpMethod.GET:
      return HttpMethods.GET;
    case HttpMethod.POST:
      return HttpMethods.POST;
    case HttpMethod.PUT:
      return HttpMethods.PUT;
    case HttpMethod.DELETE:
      return HttpMethods.DELETE;
    case HttpMethod.PATCH:
      return HttpMethods.PATCH;
    case HttpMethod.OPTIONS:
      return HttpMethods.OPTIONS;
    case HttpMethod.HEAD:
      return HttpMethods.HEAD;
  }
};

export const buildTempHandler = (
  data: TempHandlerInput,
  getBehavior: (id: string) => HttpHandlerBehavior | undefined,
  getCustomResponse: (id: string) => HttpResponseConfig | undefined = () => undefined,
  getEnabled: (id: string) => boolean = () => true,
  getMockEnabled: () => boolean = () => true,
): { handler: HttpHandler; flattenHandler: FlattenHandler } => {
  const { path, method } = data;

  const id = getRowId({ path, method });

  const created = new MswHttpHandler(toMswMethod(method), path, async () => {
    if (!getMockEnabled() || !getEnabled(id)) return passthrough();
    const behavior = getBehavior(id);
    return await getHandlerResponseByBehavior(
      behavior,
      () => createHttpResponseFromConfig(data),
      getCustomResponse(id),
    );
  });

  if (!isHttpHandler(created)) {
    throw new Error("Expected MSW http handler");
  }

  const flattenHandler: FlattenHandler = {
    id,
    path,
    method,
    handler: created,
    type: "temp",
    behavior: HttpHandlerBehavior.DEFAULT,
    enabled: true,
    tempInput: data,
  };

  return { handler: created, flattenHandler };
};

/**
 * Rebuild executable temp handlers from persisted `tempInput`.
 * Drops temp entries that cannot be reconstructed.
 */
export const rehydrateTempHandlers = (
  handlers: HydratableFlattenHandler[],
  getBehavior: (id: string) => HttpHandlerBehavior | undefined,
  getCustomResponse?: (id: string) => HttpResponseConfig | undefined,
  getEnabled?: (id: string) => boolean,
  getMockEnabled?: () => boolean,
): FlattenHandler[] => {
  const resolveCustomResponse = getCustomResponse ?? (() => undefined);
  const resolveEnabled = getEnabled ?? (() => true);
  const resolveMockEnabled = getMockEnabled ?? (() => true);
  return handlers.flatMap((entry) => {
    if (entry.type !== "temp") {
      return isRuntimeFlattenHandler(entry) ? [entry] : [];
    }
    if (!entry.tempInput) {
      return [];
    }
    const { flattenHandler } = buildTempHandler(
      entry.tempInput,
      getBehavior,
      resolveCustomResponse,
      resolveEnabled,
      resolveMockEnabled,
    );
    return [
      {
        ...flattenHandler,
        behavior: entry.behavior,
        enabled: entry.enabled ?? true,
        customResponse: entry.customResponse,
      },
    ];
  });
};
