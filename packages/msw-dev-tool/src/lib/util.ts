import { HttpHandler } from "msw";
import {
  getHandlerMap,
  getUnsupportedHandlers,
  getWorker,
} from "./handlerStore";
import { Handler, HandlerMap } from "./type";
export const updateEnableHandler = () => {
  const handlerMap = getHandlerMap();
  const worker = getWorker();
  const checkedHttpHandlerList = flatHandlerMap(handlerMap)
    .filter((h) => h.checked)
    .map((h) => h.handler);
  const otherProtocolHandlers = getUnsupportedHandlers();
  worker.resetHandlers(
    ...[...checkedHttpHandlerList, ...otherProtocolHandlers]
  );
};

export const flatHandlerMap = (handlerMap: HandlerMap) => {
  return Object.entries(handlerMap).flatMap(([url, methods]) =>
    Object.entries(methods).map(([method, { handler, checked }]) => ({
      url,
      method,
      handler,
      checked,
    }))
  );
};

export const convertHandlers = (
  handlers: Handler[]
) => {
  const unsupportedHandlers: Handler[] = [];
  const handlerMap = handlers.reduce((acc, _handler) => {
    // Current, GraphQL & WebSocketHandler is not supported.
    const handler = _handler as HttpHandler;
    if (!("info" in handler && handler.info.method && handler.info.path)) {
      unsupportedHandlers.push(handler);
      return acc;
    }
    const { method: _method, path: _path } = handler.info;
    const [method, path] = [_method.toString(), _path.toString()];
    if (!acc[path]) {
      acc[path] = {};
    }
    acc[path][method] = { handler, checked: true };
    return acc;
  }, {} as HandlerMap);
  return {handlerMap, unsupportedHandlers};
};
