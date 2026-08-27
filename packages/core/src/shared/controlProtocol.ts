import { HttpResponseConfig, HttpHandlerBehavior } from "./types";
import type {
  PersistedFlattenHandler,
  SerializableWebSocketMatcher,
  TempHandlerInput,
  WebSocketBehaviorSelection,
  WebSocketResponseConfig,
  AddWebSocketListenerInput,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
} from "./types";

/** Global property used by a CDP client to discover a configured browser session. */
export const BROWSER_CONTROL_KEY = "__MSW_DEV_TOOL_CONTROL__";

/** @deprecated Use method-level capability versions instead. */
export const BROWSER_CONTROL_PROTOCOL_VERSION = 2;

export const BROWSER_CONTROL_METHOD_VERSIONS = {
  describe: 1,
  list: 1,
  get: 1,
  setBehavior: 1,
  setCustomResponse: 2,
  addTemp: 1,
  removeTemp: 1,
  reset: 1,
  listWebSocket: 1,
  getWebSocketEndpoint: 1,
  addWebSocketEndpoint: 1,
  removeWebSocketEndpoint: 1,
  setWebSocketEndpointEnabled: 1,
  addWebSocketListener: 1,
  removeWebSocketListener: 1,
  setWebSocketListenerEnabled: 1,
  setWebSocketListenerBehavior: 1,
  setWebSocketListenerCustomResponse: 2,
  setWebSocketListenerResponse: 2,
  setWebSocketListenerEventBehavior: 1,
  setWebSocketListenerEventCustomResponse: 1,
  setWebSocketListenerEventResponse: 1,
} as const;

export type BrowserControlMethod = keyof typeof BROWSER_CONTROL_METHOD_VERSIONS;
export type BrowserControlMethodVersions = Record<BrowserControlMethod, number>;

export type BrowserControlSessionInfo = {
  revision: number;
  handlerCount: number;
};

export type BrowserControlMutationResult = BrowserControlSessionInfo & {
  handler: PersistedFlattenHandler;
};

export type BrowserControlWebSocketInfo = { endpoints: WebSocketEndpointConfig[] };
export type BrowserControlWebSocketEndpointResult = { endpoint: WebSocketEndpointConfig };
export type BrowserControlWebSocketListenerResult = {
  endpoint: WebSocketEndpointConfig;
  listener: WebSocketListenerConfig;
};
export type BrowserControlWebSocketEventResult = BrowserControlWebSocketListenerResult & {
  eventBranch: import("./types").WebSocketEventBranchConfig;
};

export type BrowserControlBridge = {
  /** @deprecated Kept for compatibility with older Browser CLI versions. */
  version: typeof BROWSER_CONTROL_PROTOCOL_VERSION;
  methods: BrowserControlMethodVersions;
  describe: () => BrowserControlSessionInfo;
  list: () => PersistedFlattenHandler[];
  get: (id: string) => PersistedFlattenHandler | undefined;
  setBehavior: (id: string, behavior: HttpHandlerBehavior) => BrowserControlMutationResult;
  setCustomResponse: (id: string, response: HttpResponseConfig) => BrowserControlMutationResult;
  addTemp: (data: TempHandlerInput) => BrowserControlMutationResult;
  removeTemp: (id: string) => BrowserControlSessionInfo;
  reset: () => BrowserControlSessionInfo;
  listWebSocket: () => WebSocketEndpointConfig[];
  getWebSocketEndpoint: (endpointId: string) => WebSocketEndpointConfig | undefined;
  addWebSocketEndpoint: (
    matcher: SerializableWebSocketMatcher,
  ) => BrowserControlWebSocketEndpointResult;
  removeWebSocketEndpoint: (endpointId: string) => BrowserControlWebSocketInfo;
  setWebSocketEndpointEnabled: (
    endpointId: string,
    enabled: boolean,
  ) => BrowserControlWebSocketEndpointResult;
  addWebSocketListener: (
    input: AddWebSocketListenerInput | string,
    behavior?: WebSocketBehaviorSelection,
  ) => BrowserControlWebSocketListenerResult;
  removeWebSocketListener: (listenerId: string) => BrowserControlWebSocketInfo;
  setWebSocketListenerEnabled: (
    listenerId: string,
    enabled: boolean,
  ) => BrowserControlWebSocketListenerResult;
  setWebSocketListenerBehavior: (
    listenerId: string,
    behavior: WebSocketBehaviorSelection,
  ) => BrowserControlWebSocketListenerResult;
  setWebSocketListenerCustomResponse: (
    listenerId: string,
    response: WebSocketResponseConfig,
  ) => BrowserControlWebSocketListenerResult;
  setWebSocketListenerResponse: (
    listenerId: string,
    response: WebSocketResponseConfig,
  ) => BrowserControlWebSocketListenerResult;
  setWebSocketListenerEventBehavior: (
    listenerId: string,
    eventType: string,
    behavior: WebSocketBehaviorSelection,
  ) => BrowserControlWebSocketEventResult;
  setWebSocketListenerEventCustomResponse: (
    listenerId: string,
    eventType: string,
    response: WebSocketResponseConfig,
  ) => BrowserControlWebSocketEventResult;
  setWebSocketListenerEventResponse: (
    listenerId: string,
    eventType: string,
    response: WebSocketResponseConfig,
  ) => BrowserControlWebSocketEventResult;
};
