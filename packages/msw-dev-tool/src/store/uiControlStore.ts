import { create } from "zustand";
import { HttpHandler } from "../lib/types";

export type UiControlState = {
  currentHandler: HttpHandler | null;
  setDebuggerHandler: (handler: HttpHandler) => void;
};

const useUiControlStore = create<UiControlState>((set) => ({
  currentHandler: null,
  setDebuggerHandler: (handler) => set({ currentHandler: handler }),
}));

export default useUiControlStore;
