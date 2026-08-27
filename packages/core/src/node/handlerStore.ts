import { setupServer, SetupServer } from "msw/node";
import { createHandlerStore, HandlerStoreInternalState, StoreApi } from "../shared/store";
import { FlattenHandler, Handler } from "../shared/types";
import { applySnapshotToRuntime, SessionController, SessionSnapshot } from "./snapshot";
import { mergeDiscoveredWebSocketState } from "../shared/websocket/state";

type NodeStore = StoreApi<HandlerStoreInternalState<SetupServer>>;

const baseStore: NodeStore = createHandlerStore<SetupServer>({
  createRuntime: (handlers) => setupServer(...handlers),
  onWebSocketStateChange: (discovered) => {
    void activeSession?.publishWebSocket(() => {
      const current = baseStore.getState().webSocket.endpoints;
      const merged = mergeDiscoveredWebSocketState(current, discovered);
      if (merged !== current) baseStore.getState().hydrateWebSocket(merged);
      return merged;
    });
  },
});

let activeSession: SessionController | null = null;

const applyExternalSnapshot = (snapshot: SessionSnapshot): void => {
  const state = baseStore.getState();
  if (!state.runtime) return;

  const flattenHandlers = applySnapshotToRuntime({
    runtime: state.runtime,
    current: state.flattenHandlers,
    snapshot,
  });
  baseStore.setState({ flattenHandlers });
  if (snapshot.state.webSocket) baseStore.getState().hydrateWebSocket(snapshot.state.webSocket);
};

const resetFromCodeHandlers = (): FlattenHandler[] => {
  baseStore.getState().resetMSWDevTool();
  return baseStore.getState().flattenHandlers;
};

/**
 * Initialize the sole Node dev-tool session in this process.
 *
 * A SetupServer has process-wide interception semantics, so multiple active
 * dev-tool sessions in one process are intentionally rejected.
 */
export const setupDevToolServer = async (...handlers: Handler[]): Promise<SetupServer> => {
  if (activeSession) {
    throw new Error(
      "MSW Dev Tool Node session is already initialized in this process. Dispose the existing session before creating another one.",
    );
  }

  const server = await baseStore.getState().setupDevToolRuntime(...handlers);
  const session = new SessionController({
    onSnapshot: applyExternalSnapshot,
    onReset: resetFromCodeHandlers,
    onResetWebSocket: () => {
      return baseStore.getState().webSocket.endpoints;
    },
  });

  try {
    await session.start(
      baseStore.getState().flattenHandlers,
      baseStore.getState().webSocket.endpoints,
    );
    activeSession = session;
    return server;
  } catch (error) {
    await session.dispose();
    throw error;
  }
};

/** @internal CLI/runtime integration only. */
export const syncNodeSession = async (): Promise<void> => {
  await activeSession?.sync();
};

/** @internal lifecycle and test teardown only. */
export const disposeNodeSession = async (): Promise<void> => {
  await activeSession?.dispose();
  activeSession = null;
};

/** @internal CLI/runtime integration only. */
export const getNodeSessionPath = (): string | null => activeSession?.sessionPath ?? null;

/** @internal test-only access to runtime store state. */
export const nodeHandlerStore = baseStore;
