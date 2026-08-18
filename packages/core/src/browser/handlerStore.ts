import { setupWorker, SetupWorker } from "msw/browser";
import { STORAGE_KEY } from "../shared/const";
import {
  createHandlerStore,
  HandlerStoreBaseState,
  HandlerStoreInternalState,
  StoreApi,
} from "../shared/store";
import { Handler } from "../shared/types";
import {
  BROWSER_CONTROL_KEY,
  BROWSER_CONTROL_METHOD_VERSIONS,
  BROWSER_CONTROL_PROTOCOL_VERSION,
  BrowserControlBridge,
} from "../shared/controlProtocol";
import { HandlerSchema } from "./schema";
import { tempHandlerSchema } from "../shared/schema";
import { getBrowserStorageSnapshot, mergeStorageData } from "./storage";

export { BROWSER_CONTROL_KEY, BrowserControlBridge } from "../shared/controlProtocol";

declare global {
  interface Window {
    __MSW_DEV_TOOL_CONTROL__?: BrowserControlBridge;
  }
}

export type HandlerStoreState = HandlerStoreBaseState & {
  /**
   * @remarks ⚠️ To be safe, access `getWorker()` rather than `get().worker` directly.
   */
  worker: SetupWorker | null;
  setupDevToolWorker: (...handlers: Handler[]) => Promise<SetupWorker>;
  getWorker: () => SetupWorker;
  addTempHandler: (handler: { data: HandlerSchema }) => void;
};

type SerializableHandler = Omit<HandlerStoreState["flattenHandlers"][number], "handler">;

const mapState = (
  base: HandlerStoreInternalState<SetupWorker>
): HandlerStoreState => ({
  worker: base.runtime,
  restHandlers: base.restHandlers,
  flattenHandlers: base.flattenHandlers,
  webSocketEndpoints: base.webSocketEndpoints,
  webSocketListeners: base.webSocketListeners,
  common: base.common,
  webSocket: base.webSocket,
  setupDevToolWorker,
  resetMSWDevTool: base.resetMSWDevTool,
  addTempHandler: base.addTempHandler,
  getWorker: base.getRuntime,
  getFlattenHandlerById: base.getFlattenHandlerById,
  getHandlerBehavior: base.getHandlerBehavior,
  setHandlerBehavior: base.setHandlerBehavior,
  getHandlerCustomResponse: base.getHandlerCustomResponse,
  setHandlerCustomResponse: base.setHandlerCustomResponse,
  removeTempHandler: base.removeTempHandler,
  registerCodeWebSocketEndpoint: base.registerCodeWebSocketEndpoint,
  registerCodeWebSocketListener: base.registerCodeWebSocketListener,
  registerHandler: base.registerHandler,
  unregisterHandler: base.unregisterHandler,
  getHandlerInfo: base.getHandlerInfo,
  listHandlerInfo: base.listHandlerInfo,
  addTempWebSocketEndpoint: base.addTempWebSocketEndpoint,
  addTempWebSocketListener: base.addTempWebSocketListener,
  removeWebSocketEndpoint: base.removeWebSocketEndpoint,
  removeWebSocketListener: base.removeWebSocketListener,
  setWebSocketEndpointEnabled: base.setWebSocketEndpointEnabled,
  setWebSocketListenerEnabled: base.setWebSocketListenerEnabled,
  setWebSocketListenerBehavior: base.setWebSocketListenerBehavior,
  hydrateWebSocket: base.hydrateWebSocket,
  getWebSocketEndpoint: base.getWebSocketEndpoint,
  getWebSocketListener: base.getWebSocketListener,
});

// Guard against SSR ReferenceError: sessionStorage is not defined.
const canUseSessionStorage = () => typeof sessionStorage !== "undefined";

const readBrowserPersistedState = ():
  | Partial<HandlerStoreInternalState<SetupWorker>>
  | undefined => {
  if (!canUseSessionStorage()) return undefined;

  if (!sessionStorage.getItem(STORAGE_KEY)) return undefined;
  const parsed = getBrowserStorageSnapshot();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return parsed.state as Partial<HandlerStoreInternalState<SetupWorker>>;
};

const writeBrowserPersistedState = (partialized: unknown) => {
  if (!canUseSessionStorage()) return;

  const previous = getBrowserStorageSnapshot();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ revision: previous.revision + 1, state: partialized }));
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
      webSocket: state.webSocket.endpoints,
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
    if ("webSocketEndpoints" in nextPartial)
      basePartial.webSocketEndpoints = nextPartial.webSocketEndpoints;
    if ("webSocketListeners" in nextPartial)
      basePartial.webSocketListeners = nextPartial.webSocketListeners;
    if ("common" in nextPartial) basePartial.common = nextPartial.common;
    if ("webSocket" in nextPartial) basePartial.webSocket = nextPartial.webSocket;

    baseStore.setState(basePartial);
  },
  subscribe: (listener) =>
    baseStore.subscribe(() => {
      cachedBase = null;
      cachedMapped = null;
      listener();
    }),
};

const toSerializable = (handler: HandlerStoreState["flattenHandlers"][number]): SerializableHandler => {
  const { handler: _handler, ...rest } = handler;
  return rest;
};

const describeBrowserSession = () => {
  const snapshot = getBrowserStorageSnapshot();
  return { revision: snapshot.revision, handlerCount: handlerStore.getState().flattenHandlers.length };
};

const requireHandler = (id: string) => {
  const handler = handlerStore.getState().getFlattenHandlerById(id);
  if (!handler) throw new Error(`Handler not found for id: ${id}`);
  return handler;
};

const registerBrowserControlBridge = () => {
  if (typeof window === "undefined") return;
  const bridge: BrowserControlBridge = {
    version: BROWSER_CONTROL_PROTOCOL_VERSION,
    methods: BROWSER_CONTROL_METHOD_VERSIONS,
    describe: describeBrowserSession,
    list: () => handlerStore.getState().flattenHandlers.map(toSerializable),
    get: (id) => {
      const handler = handlerStore.getState().getFlattenHandlerById(id);
      return handler ? toSerializable(handler) : undefined;
    },
    setBehavior: (id, behavior) => {
      requireHandler(id);
      handlerStore.getState().setHandlerBehavior(id, behavior);
      return { ...describeBrowserSession(), handler: toSerializable(requireHandler(id)) };
    },
    setCustomResponse: (id, response) => {
      requireHandler(id);
      handlerStore.getState().setHandlerCustomResponse(id, response);
      return { ...describeBrowserSession(), handler: toSerializable(requireHandler(id)) };
    },
    addTemp: (data) => {
      handlerStore.getState().addTempHandler({ data: tempHandlerSchema.parse(data) });
      const id = JSON.stringify({ path: data.path, method: data.method });
      return { ...describeBrowserSession(), handler: toSerializable(requireHandler(id)) };
    },
    removeTemp: (id) => {
      handlerStore.getState().removeTempHandler(id);
      return describeBrowserSession();
    },
    reset: () => {
      handlerStore.getState().resetMSWDevTool();
      return describeBrowserSession();
    },
  };
  window[BROWSER_CONTROL_KEY] = bridge;
};

export const setupDevToolWorker = async (...handlers: Handler[]): Promise<SetupWorker> => {
  const worker = await baseStore.getState().setupDevToolRuntime(...handlers);
  registerBrowserControlBridge();
  return worker;
};
