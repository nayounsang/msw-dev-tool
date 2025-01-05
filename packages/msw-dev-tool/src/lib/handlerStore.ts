import { HttpHandler, RequestHandler, WebSocketHandler } from "msw";
import { create } from "zustand";
import { produce } from "immer";
import { HandlerMap } from "./type";

export interface HandlerStoreState {
  handlerMap: HandlerMap;
  initHandlerMap: (
    handlers: (RequestHandler | WebSocketHandler)[]
  ) => (RequestHandler | WebSocketHandler)[];
  setHandlerMap: (handlers: HandlerMap) => HandlerMap;
  getIsChecked: (url: string, method: string) => boolean;
  setIsChecked: (url: string, method: string, isChecked: boolean) => void;
  toggleIsChecked: (url: string, method: string) => void;
}
export const useHandlerStore = create<HandlerStoreState>((set, get) => ({
  handlerMap: {},
  initHandlerMap: (handlers) => {
    console.log({handlers},"init")
    const handlerMap = handlers.reduce((acc, _handler) => {
      // Current, GraphQL & WebSocketHandler is not supported.
      const handler = _handler as HttpHandler;
      if (!("info" in handler && handler.info.method && handler.info.path)) {
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
    set({ handlerMap });
    return handlers;
  },
  setHandlerMap: (handlerMap) => {
    set({ handlerMap });
    return handlerMap;
  },
  getIsChecked: (url, method) => get().handlerMap[url]?.[method].checked,
  setIsChecked: (url, method, isChecked) => {
    set(
      produce<HandlerStoreState>((state) => {
        if (!state.handlerMap[url]) {
          return;
        }
        state.handlerMap[url][method].checked = isChecked;
      })
    );
  },
  toggleIsChecked: (url, method) => {
    set(
      produce<HandlerStoreState>((state) => {
        if (!state.handlerMap[url]?.[method]) {
          return;
        }
        state.handlerMap[url][method].checked =
          !state.handlerMap[url][method].checked;
      })
    );
  },
}));

export const initDevToolHandlers = useHandlerStore.getState().initHandlerMap;

export const getHandlerMap = () => useHandlerStore.getState().handlerMap;
