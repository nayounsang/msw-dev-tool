import { Handler, HttpHandlerBehavior } from "../types";
import { getHandlerResponseByBehavior } from "../utils/handler";
import { getRowId } from "../utils/store";
import { isHttpHandler } from "../utils/validate";

/**
 * Wraps HTTP handlers so each request resolves through the current behavior lookup.
 * Mutates resolver in place to preserve MSW handler identity (same as previous store behavior).
 */
export const wrapHandlersWithBehavior = (
  handlers: Handler[],
  getBehavior: (id: string) => HttpHandlerBehavior | undefined
): Handler[] => {
  return handlers.map((handler) => {
    if (!isHttpHandler(handler)) {
      return handler;
    }

    const originalResolver = handler.resolver;
    handler.resolver = async (args) => {
      const id = getRowId({
        path: handler.info.path.toString(),
        method: handler.info.method.toString(),
      });
      const behavior = getBehavior(id);

      return await getHandlerResponseByBehavior(behavior, () =>
        originalResolver(args)
      );
    };
    return handler;
  });
};
