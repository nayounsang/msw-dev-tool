import { SetupWorker } from "msw/browser";
import { create } from "zustand";
import { produce } from "immer";
import { Handler, HandlerMap } from "./type";
import { convertHandlers, flatHandlerMap } from "./util";
import { dummyHandler } from "../const/handler";
import { HttpHandler } from "msw";

export interface HandlerStoreState {
  worker: SetupWorker | null;
  /**
   * HTTP handler map
   */
  handlerMap: HandlerMap;
  /**
   * GraphQL or WebSocketHandler
   *
   * *Currently not supported*
   */
  restHandlers: Handler[];
  initMSWDevTool: (worker: SetupWorker) => SetupWorker;
  setHandlerMap: (handlers: HandlerMap) => HandlerMap;
  getIsChecked: (url: string, method: string) => boolean;
  setIsChecked: (url: string, method: string, isChecked: boolean) => void;
  toggleIsChecked: (url: string, method: string) => void;
  getWorker: () => SetupWorker;
  getTotalEnableHandlers: () => (Handler | HttpHandler)[];
  /**
   * This has to do with `msw` internal workings.
   * If I spread an empty array in `resetHandlers`, it will be replaced by `initialHandler`.
   * Therefore, I proposed the `clear` method, but unfortunately it was not accepted!
   */
  updateEnableHandlers: () => void;
}
export const useHandlerStore = create<HandlerStoreState>((set, get) => ({
  handlerMap: {},
  worker: null,
  restHandlers: [],
  initMSWDevTool: (_worker) => {
    const worker = _worker;
    set({ worker });
    const handlers = worker.listHandlers() as Handler[];
    const { handlerMap, unsupportedHandlers } = convertHandlers(handlers);
    set({ handlerMap });
    set({ restHandlers: unsupportedHandlers });
    return worker;
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
    get().updateEnableHandlers();
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
    get().updateEnableHandlers();
  },
  getWorker: () => {
    const worker = get().worker;
    if (!worker) throw new Error("Worker is not initialized");
    return worker;
  },
  getTotalEnableHandlers: () => {
    const handlerMapList = flatHandlerMap(get().handlerMap);
    const checkedHttpHandlers = handlerMapList
      .filter((h) => h.checked)
      .map((h) => h.handler);
    const otherProtocolHandlers = get().restHandlers;
    return [...checkedHttpHandlers, ...otherProtocolHandlers];
  },
  updateEnableHandlers: () => {
    const worker = get().getWorker();
    const totalEnableHandlers = get().getTotalEnableHandlers();
    if (totalEnableHandlers.length === 0) {
      worker.resetHandlers(dummyHandler);
      return;
    }

    worker.resetHandlers(...totalEnableHandlers);
  },
}));

export const initMSWDevTool = useHandlerStore.getState().initMSWDevTool;
