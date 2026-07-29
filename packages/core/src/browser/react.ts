import { useRef, useSyncExternalStore } from "react";
import { handlerStore } from "./handlerStore";
import type { HandlerStoreState } from "./handlerStore";

export const useHandlerStore = <T>(
  selector: (state: HandlerStoreState) => T
): T => {
  const stateRef = useRef(handlerStore.getState());
  const selectorRef = useRef(selector);
  const sliceRef = useRef<T>(selector(handlerStore.getState()));

  const getSnapshot = () => {
    const state = handlerStore.getState();

    if (state !== stateRef.current || selector !== selectorRef.current) {
      stateRef.current = state;
      selectorRef.current = selector;
      sliceRef.current = selectorRef.current(state);
    }

    return sliceRef.current;
  };

  return useSyncExternalStore(
    handlerStore.subscribe,
    getSnapshot,
    getSnapshot
  );
};
