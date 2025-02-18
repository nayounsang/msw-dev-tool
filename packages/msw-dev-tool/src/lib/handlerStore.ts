import { SetupWorker } from "msw/browser";
import { create } from "zustand";
import { FlattenHandler, Handler } from "./type";
import {
  convertHandlers,
  getTotalEnableHandlers,
  initMSWDevToolStore,
  updateEnableHandlers,
} from "./util";
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
}
export const useHandlerStore = create<HandlerStoreState>((set, get) => ({
  flattenHandlers: [],
  worker: null,
  restHandlers: [],
  handlerRowSelection: {},
  initMSWDevTool: (_worker) => {
    const {
      worker,
      flattenHandlers,
      handlerRowSelection,
      unsupportedHandlers,
    } = initMSWDevToolStore(_worker);

    set({ worker });
    set({ flattenHandlers });
    set({
      handlerRowSelection,
    });
    set({ restHandlers: unsupportedHandlers });

    return worker;
  },
  handleHandlerRowSelectionChange: (updater) => {
    const worker = get().getWorker();

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

    const flattenHandlers = get().flattenHandlers;
    const restHandlers = get().restHandlers;
    const totalEnableHandlers = getTotalEnableHandlers(
      flattenHandlers,
      restHandlers
    );
    updateEnableHandlers(worker, totalEnableHandlers);
  },
  getWorker: () => {
    const worker = get().worker;
    if (!worker) throw new Error("Worker is not initialized");
    return worker;
  },
}));

export const initMSWDevTool = useHandlerStore.getState().initMSWDevTool;
