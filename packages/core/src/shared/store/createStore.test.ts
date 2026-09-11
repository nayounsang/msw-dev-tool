import { describe, expect, it, vi } from "vitest";
import { createStore } from "./createStore";

describe("createStore", () => {
  it("hydrates persisted state before exposing the store", () => {
    const write = vi.fn();
    const store = createStore(() => ({ count: 1 }), {
      name: "counter",
      partialize: (state) => state,
      getStoredState: () => ({ count: 4 }),
      write,
    });

    expect(store.getState()).toEqual({ count: 4 });
    expect(write).not.toHaveBeenCalled();
  });

  it("applies object and functional updates and notifies active subscribers", () => {
    const write = vi.fn();
    const listener = vi.fn();
    const store = createStore(() => ({ count: 1 }), {
      name: "counter",
      partialize: (state) => state,
      getStoredState: () => undefined,
      write,
    });
    const unsubscribe = store.subscribe(listener);

    store.setState({ count: 2 });
    store.setState((state) => ({ count: state.count + 1 }));
    unsubscribe();
    store.setState({ count: 4 });

    expect(store.getState()).toEqual({ count: 4 });
    expect(write).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
