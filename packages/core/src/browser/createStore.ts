type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>)
) => void;
type GetState<T> = () => T;
type Subscribe = (listener: () => void) => () => void;

export type StoreApi<T> = {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: Subscribe;
};

type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

type PersistOptions<T> = {
  name: string;
  partialize: (state: T) => unknown;
  getStoredState?: () => Partial<T> | undefined;
};

export const createStore = <T>(
  createState: StateCreator<T>,
  persistOptions?: PersistOptions<T>
): StoreApi<T> => {
  let state: T;
  const listeners = new Set<() => void>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial) => {
    const nextPartial =
      typeof partial === "function"
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        ? (partial as (state: T) => Partial<T>)(state)
        : partial;
    state = { ...state, ...nextPartial };

    if (persistOptions) {
      try {
        sessionStorage.setItem(
          persistOptions.name,
          JSON.stringify({ state: persistOptions.partialize(state) })
        );
      } catch {
        // Ignore storage quota / unavailable errors.
      }
    }

    listeners.forEach((listener) => listener());
  };

  const subscribe: Subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = createState(setState, getState);

  if (persistOptions) {
    const stored =
      persistOptions.getStoredState?.() ??
      readPersistedState<Partial<T>>(persistOptions.name);
    if (stored) {
      state = { ...state, ...stored };
    }
  }

  return { getState, setState, subscribe };
};

const readPersistedState = <T>(name: string): T | undefined => {
  try {
    const raw = sessionStorage.getItem(name);
    if (!raw) return undefined;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return JSON.parse(raw).state as T;
  } catch {
    return undefined;
  }
};
