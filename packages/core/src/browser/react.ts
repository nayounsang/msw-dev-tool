import { useStore } from "zustand";
import { handlerStore } from "./handlerStore";
import type { HandlerStoreState } from "./handlerStore";

export const useHandlerStore = <T>(
  selector: (state: HandlerStoreState) => T
): T => useStore(handlerStore, selector);
