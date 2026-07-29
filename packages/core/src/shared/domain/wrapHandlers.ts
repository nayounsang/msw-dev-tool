import { HttpResponse } from "msw";
import { HttpHandlerBehavior } from "../types";
import { getHandlerResponseByBehavior } from "../utils/handler";
import { getRowId } from "../utils/store";
import { isHttpHandler } from "../utils/validate";

const toStrictResolverResult = async (
  result: unknown
): Promise<HttpResponse | undefined> => {
  const value = result instanceof Promise ? await result : result;

  if (value === undefined || value === null) {
    return undefined;
  }

  if (value instanceof HttpResponse) {
    return value;
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
  getBehavior: (id: string) => HttpHandlerBehavior | undefined
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

      return await getHandlerResponseByBehavior(behavior, () =>
        toStrictResolverResult(originalResolver(args))
      );
    };
    return handler;
  });
};
