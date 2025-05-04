import { useStore } from "zustand";
import { handlerStore } from "./handlerStore";
import type { HandlerStoreState } from "./handlerStore";

// selector 타입을 제네릭으로 받아서, 반환 타입도 자동 추론되게!
export const useHandlerStore = <T>(
  selector: (state: HandlerStoreState) => T
): T => useStore(handlerStore, selector);
