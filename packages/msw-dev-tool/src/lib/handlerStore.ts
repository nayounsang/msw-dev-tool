import { HttpHandler, WebSocketHandler } from "msw";
import { create } from "zustand";
import { produce } from "immer";
import { HandlerMap } from "./type";

export interface HandlerStoreState {
  handlerMap: HandlerMap;
  initHandlerMap: (handlers: HttpHandler[]) => void;
  setHandlerMap: (handlers: HandlerMap) => HandlerMap;
  getIsChecked: (url: string, method: string) => boolean;
  setIsChecked: (url: string, method: string, isChecked: boolean) => void;
  toggleIsChecked: (url: string, method: string, isChecked: boolean) => void;
}
export const useHandlerStore = create<HandlerStoreState>((set, get) => ({
  handlerMap: {},
  initHandlerMap: (handlers: (HttpHandler | WebSocketHandler)[]) => {
    const handlerMap = handlers.reduce((acc, handler) => {
      // Current, WebSocketHandler is not supported.
      if (handler instanceof WebSocketHandler) {
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
  },
  setHandlerMap: (handlerMap: HandlerMap) => {
    set({ handlerMap });
    return handlerMap;
  },
  getIsChecked: (url: string, method: string) =>
    get().handlerMap[url]?.[method].checked,
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
  toggleIsChecked: (url: string, method: string) => {
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

export const initDevToolHandlers = () =>
  useHandlerStore.getState().initHandlerMap;

export const getHandlerMap = () => useHandlerStore.getState().handlerMap;