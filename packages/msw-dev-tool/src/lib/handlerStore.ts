"use client";

import { SetupWorker } from "msw/browser";
import { create } from "zustand";
import { FlattenHandler, Handler, HttpHandlerBehavior } from "./type";
import {
  getHandlerResponseByBehavior,
  getRowId,
  getTotalEnableHandlers,
  initMSWDevToolStore,
  isHttpHandler,
  updateEnableHandlers,
} from "./util";
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import isFunction from "lodash/isFunction";
import { setupWorker as _setupWorker } from "../utils/mswBrowser";

export interface HandlerStoreState {
  /**
   * @remarks ⚠️ To be safe, access `getWorker()` rather than `get().worker` directly.
   */
  worker: SetupWorker | null;
  /**
   * GraphQL or WebSocketHandler
   *
   * **Currently not supported**
   */
  restHandlers: Handler[];
  flattenHandlers: FlattenHandler[];
  handlerRowSelection: RowSelectionState;
  setupDevToolWorker: (...handlers: Handler[]) => Promise<SetupWorker>;
  /**
   * @deprecated use `setupDevToolWorker` instead.
   */
  initMSWDevTool: (worker: SetupWorker) => SetupWorker;
  resetMSWDevTool: () => void;
  handleHandlerRowSelectionChange: OnChangeFn<RowSelectionState>;
  getWorker: () => SetupWorker;
  getFlattenHandlerById: (id: string) => FlattenHandler | undefined;
  getHandlerBehavior: (id: string) => HttpHandlerBehavior | undefined;
  setHandlerBehavior: (id: string, behavior: HttpHandlerBehavior) => void;
}
export const useHandlerStore = create<HandlerStoreState>((set, get) => ({
  flattenHandlers: [],
  worker: null,
  restHandlers: [],
  handlerRowSelection: {},
  setupDevToolWorker: async (...handlers: Handler[]) => {
    const _handlers = handlers.map((handler) => {
      if (!isHttpHandler(handler)) {
        return handler;
      }

      const originalResolver = handler.resolver;
      handler.resolver = async (args) => {
        const id = getRowId({
          path: handler.info.path.toString(),
          method: handler.info.method.toString(),
        });
        const behavior = get().getHandlerBehavior(id);

        return await getHandlerResponseByBehavior(behavior, () =>
          originalResolver(args)
        );
      };
      return handler;
    });

    const setupWorker = await _setupWorker;
    if (!setupWorker) {
      throw new Error(
        "Fail to import 'msw/browser'. Is environment is not browser?"
      );
    }
    const worker = setupWorker?.(..._handlers);

    const { flattenHandlers, handlerRowSelection, unsupportedHandlers } =
      initMSWDevToolStore(worker);
    set({
      worker,
      flattenHandlers,
      handlerRowSelection,
      restHandlers: unsupportedHandlers,
    });

    return worker;
  },
  initMSWDevTool: (_worker) => {
    const {
      worker,
      flattenHandlers,
      handlerRowSelection,
      unsupportedHandlers,
    } = initMSWDevToolStore(_worker);

    set({
      worker,
      flattenHandlers,
      handlerRowSelection,
      restHandlers: unsupportedHandlers,
    });

    return worker;
  },
  resetMSWDevTool: () => {
    const _worker = get().getWorker();
    _worker.resetHandlers();

    const {
      worker,
      flattenHandlers,
      handlerRowSelection,
      unsupportedHandlers,
    } = initMSWDevToolStore(_worker);

    set({
      worker,
      flattenHandlers,
      handlerRowSelection,
      restHandlers: unsupportedHandlers,
    });
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
  getFlattenHandlerById: (id: string) => {
    return get().flattenHandlers.find((handler) => handler.id === id);
  },
  getHandlerBehavior: (id: string) => {
    const handler = get().getFlattenHandlerById(id);
    if (!handler) return undefined;
    return handler.behavior;
  },
  setHandlerBehavior: (id: string, behavior: HttpHandlerBehavior) => {
    set({
      flattenHandlers: get().flattenHandlers.map((handler) => {
        if (handler.id === id) {
          return { ...handler, behavior };
        }
        return handler;
      }),
    });
  },
}));

export const initMSWDevTool = useHandlerStore.getState().initMSWDevTool;
export const setupDevToolWorker = useHandlerStore.getState().setupDevToolWorker;
