import {
  CustomResponse,
  FlattenHandler,
  Handler,
  HttpHandlerBehavior,
  ManagedWebSocketEndpoint,
  ManagedWebSocketListener,
  DevToolHandlerInfo,
  WebSocketBehaviorSelection,
  WebSocketResponse,
  WebSocketRepeat,
  AddWebSocketListenerInput,
  WebSocketEndpointConfig,
  TempHandlerInput,
} from "../types";
import type { HydratableFlattenHandler } from "../utils/storage";
import { ListHandlersRuntime } from "../utils";
import { PersistOptions, StoreApi } from "./createStore";
import type { HandlerRegistryState } from "./commonSlice";
import type { WebSocketRuntimeAdapter, WebSocketStoreState } from "./webSocketSlice";

export type MswDevToolRuntime = ListHandlersRuntime & {
  use: (...handlers: Handler[]) => void;
  resetHandlers: () => void;
};

export type HandlerStoreBaseState = {
  common: HandlerRegistryState;
  webSocket: WebSocketStoreState;
  /** GraphQL handlers and unsupported handlers. */
  restHandlers: unknown[];
  flattenHandlers: FlattenHandler[];
  resetMSWDevTool: () => void;
  addTempHandler: (handler: { data: TempHandlerInput }) => void;
  getFlattenHandlerById: (id: string) => FlattenHandler | undefined;
  getHandlerBehavior: (id: string) => HttpHandlerBehavior | undefined;
  setHandlerBehavior: (id: string, behavior: HttpHandlerBehavior) => void;
  getHandlerCustomResponse: (id: string) => CustomResponse | undefined;
  setHandlerCustomResponse: (id: string, response: CustomResponse) => void;
  removeTempHandler: (id: string) => void;
  webSocketEndpoints: ManagedWebSocketEndpoint[];
  webSocketListeners: ManagedWebSocketListener[];
  registerCodeWebSocketEndpoint: (endpoint: ManagedWebSocketEndpoint) => void;
  registerCodeWebSocketListener: (listener: ManagedWebSocketListener) => void;
  registerHandler: (info: DevToolHandlerInfo) => void;
  unregisterHandler: (id: string) => void;
  getHandlerInfo: (id: string) => DevToolHandlerInfo | undefined;
  listHandlerInfo: (kind?: "http" | "websocket") => DevToolHandlerInfo[];
  addTempWebSocketEndpoint: (input: {
    matcher: WebSocketEndpointConfig["matcher"];
    endpoint: string;
  }) => string;
  addTempWebSocketListener: (input: AddWebSocketListenerInput) => string;
  removeWebSocketEndpoint: (endpointId: string) => void;
  removeWebSocketListener: (listenerId: string) => void;
  setWebSocketEndpointEnabled: (endpointId: string, enabled: boolean) => void;
  setWebSocketListenerEnabled: (listenerId: string, enabled: boolean) => void;
  setWebSocketListenerBehavior: (listenerId: string, behavior: WebSocketBehaviorSelection) => void;
  setWebSocketListenerCustomResponse: (listenerId: string, response: WebSocketResponse) => void;
  setWebSocketListenerResponse: (listenerId: string, response: WebSocketResponse) => void;
  setWebSocketListenerSchedule: (
    listenerId: string,
    input: { delay?: number; repeat?: WebSocketRepeat },
  ) => void;
  hydrateWebSocket: (endpoints: WebSocketEndpointConfig[]) => void;
  getWebSocketEndpoint: (endpointId: string) => WebSocketEndpointConfig | undefined;
  getWebSocketListener: (
    listenerId: string,
  ) => WebSocketEndpointConfig["listeners"][number] | undefined;
};

export type HandlerStoreInternalState<TRuntime extends MswDevToolRuntime> =
  HandlerStoreBaseState & {
    runtime: TRuntime | null;
    setupDevToolRuntime: (...handlers: Handler[]) => Promise<TRuntime>;
    getRuntime: () => TRuntime;
  };

export type CreateHandlerStoreOptions<TRuntime extends MswDevToolRuntime> = {
  createRuntime: (handlers: Handler[]) => TRuntime;
  mergeOnSetup?: (args: {
    flattenHandlers: FlattenHandler[];
    unsupportedHandlers: unknown[];
    runtime: TRuntime;
  }) => HydratableFlattenHandler[];
  onSetup?: (args: { runtime: TRuntime; flattenHandlers: FlattenHandler[] }) => void;
  persist?: PersistOptions<HandlerStoreInternalState<TRuntime>>;
  webSocketRuntime?: WebSocketRuntimeAdapter;
  getStoredWebSocketState?: () => unknown;
};

export type HandlerStoreApi<TRuntime extends MswDevToolRuntime> = StoreApi<
  HandlerStoreInternalState<TRuntime>
>;
