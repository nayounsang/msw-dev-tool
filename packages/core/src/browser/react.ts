import { useRef, useSyncExternalStore } from "react";
import { handlerStore } from "./handlerStore";
import type { HandlerStoreState } from "./handlerStore";

export const useHandlerStore = <T>(
  selector: (state: HandlerStoreState) => T
): T => {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const sliceRef = useRef<T>(selector(handlerStore.getState()));

  const getSnapshot = () => {
    const nextSlice = selectorRef.current(handlerStore.getState());
    if (!Object.is(sliceRef.current, nextSlice)) {
      sliceRef.current = nextSlice;
    }
    return sliceRef.current;
  };

  return useSyncExternalStore(
    handlerStore.subscribe,
    getSnapshot,
    getSnapshot
  );
};
