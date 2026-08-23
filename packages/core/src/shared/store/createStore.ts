type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetState<T> = () => T;
type Subscribe = (listener: () => void) => () => void;

export type StoreApi<T> = {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: Subscribe;
};

type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

export type PersistOptions<T> = {
  name: string;
  partialize: (state: T) => unknown;
  getStoredState: () => Partial<T> | undefined;
  write: (partialized: unknown) => void;
};

export const createStore = <T>(
  createState: StateCreator<T>,
  persistOptions?: PersistOptions<T>,
): StoreApi<T> => {
  let state: T;
  const listeners = new Set<() => void>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial) => {
    const nextPartial =
      typeof partial === "function"
        ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          (partial as (state: T) => Partial<T>)(state)
        : partial;
    state = { ...state, ...nextPartial };

    if (persistOptions) {
      persistOptions.write(persistOptions.partialize(state));
    }

    listeners.forEach((listener) => listener());
  };

  const subscribe: Subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = createState(setState, getState);

  if (persistOptions) {
    const stored = persistOptions.getStoredState();
    if (stored) {
      state = { ...state, ...stored };
    }
  }

  return { getState, setState, subscribe };
};
