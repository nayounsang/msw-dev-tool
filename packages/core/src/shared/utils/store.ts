import { FlattenHandler, HttpHandlerBehavior, HttpMethod } from "../types";
import { httpMethodSchema, rowIdSchema } from "../schema";
import { isHttpHandler } from "./validate";

export type ListHandlersRuntime = {
  listHandlers: () => readonly unknown[];
};

export const getRowId = ({ path, method }: { path: string; method: string }) =>
  JSON.stringify({
    path,
    method,
  });

export const getObjFromRowId = (rowId: string) => rowIdSchema.parse(JSON.parse(rowId));

const normalizeHttpMethod = (method: string): HttpMethod =>
  httpMethodSchema.parse(method.toLowerCase());

export const convertHandlers = (handlers: readonly unknown[]) => {
  const unsupportedHandlers: unknown[] = [];
  const flattenHandlers: FlattenHandler[] = [];

  for (const handler of handlers) {
    if (!isHttpHandler(handler)) {
      unsupportedHandlers.push(handler);
      continue;
    }

    const { method: _method, path: _path } = handler.info;
    const path = _path.toString();
    const method = normalizeHttpMethod(_method.toString());

    flattenHandlers.push({
      id: getRowId({ path, method }),
      path,
      method,
      handler,
      behavior: HttpHandlerBehavior.DEFAULT,
      enabled: true,
      type: "default",
    });
  }

  return { flattenHandlers, unsupportedHandlers };
};

export const initMSWDevToolStore = <T extends ListHandlersRuntime>(runtime: T) => {
  const handlers = runtime.listHandlers();
  const { flattenHandlers, unsupportedHandlers } = convertHandlers(handlers);

  return { worker: runtime, flattenHandlers, unsupportedHandlers };
};
