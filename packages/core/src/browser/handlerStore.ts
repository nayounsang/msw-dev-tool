import { setupWorker, SetupWorker } from "msw/browser";
import { STORAGE_KEY } from "../shared/const";
import {
  createHandlerStore,
  HandlerStoreBaseState,
  HandlerStoreInternalState,
  StoreApi,
} from "../shared/store";
import { Handler } from "../shared/types";
import { HandlerSchema } from "./schema";
import { mergeStorageData } from "./storage";

export type HandlerStoreState = HandlerStoreBaseState & {
  /**
   * @remarks ⚠️ To be safe, access `getWorker()` rather than `get().worker` directly.
   */
  worker: SetupWorker | null;
  setupDevToolWorker: (...handlers: Handler[]) => Promise<SetupWorker>;
  getWorker: () => SetupWorker;
  addTempHandler: (handler: { data: HandlerSchema }) => void;
};

const mapState = (
  base: HandlerStoreInternalState<SetupWorker>
): HandlerStoreState => ({
  worker: base.runtime,
  restHandlers: base.restHandlers,
  flattenHandlers: base.flattenHandlers,
  setupDevToolWorker: base.setupDevToolRuntime,
  resetMSWDevTool: base.resetMSWDevTool,
  addTempHandler: base.addTempHandler,
  getWorker: base.getRuntime,
  getFlattenHandlerById: base.getFlattenHandlerById,
  getHandlerBehavior: base.getHandlerBehavior,
  setHandlerBehavior: base.setHandlerBehavior,
  removeTempHandler: base.removeTempHandler,
});

// Guard against SSR ReferenceError: sessionStorage is not defined.
const canUseSessionStorage = () => typeof sessionStorage !== "undefined";

const readBrowserPersistedState = ():
  | Partial<HandlerStoreInternalState<SetupWorker>>
  | undefined => {
  if (!canUseSessionStorage()) return undefined;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;

  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("state" in parsed)
  ) {
    throw new Error(
      `Invalid msw-dev-tool sessionStorage payload for key "${STORAGE_KEY}"`
    );
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (parsed as { state: Partial<HandlerStoreInternalState<SetupWorker>> })
    .state;
};

const writeBrowserPersistedState = (partialized: unknown) => {
  if (!canUseSessionStorage()) return;

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ state: partialized })
  );
};

const baseStore = createHandlerStore<SetupWorker>({
  createRuntime: (handlers) => setupWorker(...handlers),
  mergeOnSetup: ({ flattenHandlers }) => {
    const { flattenHandlers: mergedHandlers } = mergeStorageData({
      flattenHandlers,
    });
    return mergedHandlers;
  },
  persist: {
    name: STORAGE_KEY,
    partialize: (state) => ({
      flattenHandlers: state.flattenHandlers.map(
        ({ handler: _handler, ...rest }) => rest
      ),
    }),
    getStoredState: readBrowserPersistedState,
    write: writeBrowserPersistedState,
  },
});

let cachedBase: HandlerStoreInternalState<SetupWorker> | null = null;
let cachedMapped: HandlerStoreState | null = null;

const getMappedState = (): HandlerStoreState => {
  const base = baseStore.getState();
  if (base !== cachedBase || !cachedMapped) {
    cachedBase = base;
    cachedMapped = mapState(base);
  }
  return cachedMapped;
};

export const handlerStore: StoreApi<HandlerStoreState> = {
  getState: getMappedState,
  setState: (partial) => {
    const current = getMappedState();
    const nextPartial =
      typeof partial === "function" ? partial(current) : partial;

    const basePartial: Partial<HandlerStoreInternalState<SetupWorker>> = {};
    if ("worker" in nextPartial) basePartial.runtime = nextPartial.worker;
    if ("restHandlers" in nextPartial)
      basePartial.restHandlers = nextPartial.restHandlers;
    if ("flattenHandlers" in nextPartial)
      basePartial.flattenHandlers = nextPartial.flattenHandlers;

    baseStore.setState(basePartial);
  },
  subscribe: (listener) =>
    baseStore.subscribe(() => {
      cachedBase = null;
      cachedMapped = null;
      listener();
    }),
};

export const setupDevToolWorker = baseStore.getState().setupDevToolRuntime;
