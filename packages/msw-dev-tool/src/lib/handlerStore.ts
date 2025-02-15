import { SetupWorker } from "msw/browser";
import { create } from "zustand";
import { FlattenHandler, Handler } from "./type";
import { convertHandlers } from "./util";
import { dummyHandler } from "../const/handler";
import { HttpHandler } from "msw";
import { OnChangeFn, RowSelectionState, Updater } from "@tanstack/react-table";
import { isFunction } from "lodash";

export interface HandlerStoreState {
  worker: SetupWorker | null;
  /**
   * GraphQL or WebSocketHandler
   *
   * **Currently not supported**
   */
  restHandlers: Handler[];
  flattenHandlers: FlattenHandler[];
  handlerRowSelection: RowSelectionState;
  initMSWDevTool: (worker: SetupWorker) => SetupWorker;
  handleHandlerRowSelectionChange: OnChangeFn<RowSelectionState>;
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
  flattenHandlers: [],
  worker: null,
  restHandlers: [],
  handlerRowSelection: {},
  initMSWDevTool: (_worker) => {
    const worker = _worker;
    const handlers = worker.listHandlers() as Handler[];
    const { flattenHandlers, unsupportedHandlers } = convertHandlers(handlers);
    const handlerRowSelection = flattenHandlers.reduce((acc, handler) => {
      acc[handler.id] = handler.enabled;
      return acc;
    }, {} as RowSelectionState);

    set({ worker });
    set({ flattenHandlers });
    set({
      handlerRowSelection,
    });
    set({ restHandlers: unsupportedHandlers });
    
    return worker;
  },
  handleHandlerRowSelectionChange: (updater) => {
    if (isFunction(updater)) {
      set(({ handlerRowSelection }) => {
        const next = updater(handlerRowSelection);
        const current = get().flattenHandlers.map((handler) =>
          next[handler.id]
            ? { ...handler, enabled: true }
            : { ...handler, enabled: false }
        );
        return { handlerRowSelection: next, flattenHandlers: current };
      });
    } else {
      const current = get().flattenHandlers.map((handler) =>
        updater[handler.id]
          ? { ...handler, enabled: true }
          : { ...handler, enabled: false }
      );
      set({ handlerRowSelection: updater, flattenHandlers: current });
    }
    get().updateEnableHandlers();
  },
  getWorker: () => {
    const worker = get().worker;
    if (!worker) throw new Error("Worker is not initialized");
    return worker;
  },
  getTotalEnableHandlers: () => {
    const checkedHttpHandlers = get()
      .flattenHandlers.filter((h) => h.enabled)
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
