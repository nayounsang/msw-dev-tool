import { HttpHandler } from "msw";
import { create } from "zustand";

export type UiControlState = {
  currentHandler: HttpHandler | null;
  setDebuggerHandler: (handler: HttpHandler) => void;
};

const useUiControlStore = create<UiControlState>((set) => ({
  currentHandler: null,
  setDebuggerHandler: (handler) => set({ currentHandler: handler }),
}));

export default useUiControlStore;
