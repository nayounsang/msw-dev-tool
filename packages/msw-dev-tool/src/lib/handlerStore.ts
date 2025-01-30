import { SetupWorker } from "msw/browser";
import { create } from "zustand";
import { produce } from "immer";
import { Handler, HandlerMap } from "./type";
import { convertHandlers, flatHandlerMap} from "./util";

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
    updateEnableHandler();
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
    updateEnableHandler();
  },
}));

export const initMSWDevTool = useHandlerStore.getState().initMSWDevTool;

const getHandlerMap = () => useHandlerStore.getState().handlerMap;

const getWorker = () => {
  const worker = useHandlerStore.getState().worker;
  if (!worker) throw new Error("Worker is not initialized");
  return worker;
};

const getUnsupportedHandlers = () =>
  useHandlerStore.getState().restHandlers;

const updateEnableHandler = () => {
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