import { HttpResponse, passthrough } from "msw";
import type { BehaviorResolverResult } from "../types";
import { HttpResponseConfig, HttpHandlerBehavior } from "../types";
import { getHandlerResponseByBehavior } from "../utils/handler";
import { getRowId } from "../utils/store";
import { isHttpHandler } from "../utils/validate";

const toStrictResolverResult = async (result: unknown): Promise<BehaviorResolverResult> => {
  const value = result instanceof Promise ? await result : result;

  if (value === undefined || value === null) {
    return undefined;
  }

  if (value instanceof HttpResponse) {
    return value;
  }

  if (value instanceof Response && value.type === "error") {
    return HttpResponse.error();
  }

  if (value instanceof Response) {
    return new HttpResponse(value.body, value);
  }

  return new HttpResponse(null);
};

/**
 * Wraps HTTP handlers so each request resolves through the current behavior lookup.
 * Mutates resolver in place to preserve MSW handler identity (same as previous store behavior).
 */
export const wrapHandlersWithBehavior = <T>(
  handlers: T[],
  getBehavior: (id: string) => HttpHandlerBehavior | undefined,
  getCustomResponse: (id: string) => HttpResponseConfig | undefined = () => undefined,
  getEnabled: (id: string) => boolean = () => true,
  getMockEnabled: () => boolean = () => true,
): T[] => {
  return handlers.map((handler) => {
    if (!isHttpHandler(handler)) {
      return handler;
    }

    const originalResolver = handler.resolver;
    handler.resolver = async (args) => {
      const id = getRowId({
        path: handler.info.path.toString(),
        method: handler.info.method.toString().toLowerCase(),
      });
      const behavior = getBehavior(id);
      if (!getMockEnabled() || !getEnabled(id)) return passthrough();

      return await getHandlerResponseByBehavior(
        behavior,
        () => toStrictResolverResult(originalResolver(args)),
        getCustomResponse(id),
      );
    };
    return handler;
  });
};
