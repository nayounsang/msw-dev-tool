import type {
  HttpResponseConfig,
  HttpHandlerBehavior,
  PersistedFlattenHandler,
  TempHandlerInput,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
  WebSocketBehaviorSelection,
  WebSocketResponseConfig,
  WebSocketEventBranchConfig,
  AddWebSocketListenerInput,
  SerializableWebSocketMatcher,
} from "@msw-dev-tool/core/shared";

export type CliHandler = PersistedFlattenHandler;

export type CliSessionInfo = {
  revision: number;
  pendingReset?: boolean;
  handlerCount: number;
};

export type CliMutationResult = CliSessionInfo & { handler: CliHandler };

export type CliWebSocketInfo = {
  endpoints: WebSocketEndpointConfig[];
};

export type CliWebSocketEndpointResult = {
  endpoint: WebSocketEndpointConfig;
};

export type CliWebSocketListenerResult = {
  endpoint: WebSocketEndpointConfig;
  listener: WebSocketListenerConfig;
};
export type CliWebSocketEventResult = CliWebSocketListenerResult & {
  eventBranch: WebSocketEventBranchConfig;
};

export type CliSession = {
  describe(): Promise<CliSessionInfo>;
  list(): Promise<CliHandler[]>;
  get(id: string): Promise<CliHandler | undefined>;
  setBehavior(id: string, behavior: HttpHandlerBehavior): Promise<CliMutationResult>;
  setCustomResponse(id: string, response: HttpResponseConfig): Promise<CliMutationResult>;
  addTemp(data: TempHandlerInput): Promise<CliMutationResult>;
  removeTemp(id: string): Promise<CliSessionInfo>;
  reset(): Promise<CliSessionInfo>;
  listWebSocket(): Promise<WebSocketEndpointConfig[]>;
  getWebSocketEndpoint(endpointId: string): Promise<WebSocketEndpointConfig | undefined>;
  addWebSocketEndpoint(matcher: SerializableWebSocketMatcher): Promise<CliWebSocketEndpointResult>;
  removeWebSocketEndpoint(endpointId: string): Promise<CliWebSocketInfo>;
  setWebSocketEndpointEnabled(
    endpointId: string,
    enabled: boolean,
  ): Promise<CliWebSocketEndpointResult>;
  addWebSocketListener(input: AddWebSocketListenerInput): Promise<CliWebSocketListenerResult>;
  /** @deprecated Pass AddWebSocketListenerInput instead. */
  addWebSocketListener(
    endpointId: string,
    behavior: WebSocketBehaviorSelection,
  ): Promise<CliWebSocketListenerResult>;
  removeWebSocketListener(listenerId: string): Promise<CliWebSocketInfo>;
  setWebSocketListenerEnabled(
    listenerId: string,
    enabled: boolean,
  ): Promise<CliWebSocketListenerResult>;
  setWebSocketListenerBehavior(
    listenerId: string,
    behavior: WebSocketBehaviorSelection,
  ): Promise<CliWebSocketListenerResult>;
  setWebSocketListenerCustomResponse(
    listenerId: string,
    response: WebSocketResponseConfig,
  ): Promise<CliWebSocketListenerResult>;
  setWebSocketListenerResponse(
    listenerId: string,
    response: WebSocketResponseConfig,
  ): Promise<CliWebSocketListenerResult>;
  setWebSocketListenerEventBehavior(
    listenerId: string,
    eventType: string,
    behavior: WebSocketBehaviorSelection,
  ): Promise<CliWebSocketEventResult>;
  setWebSocketListenerEventCustomResponse(
    listenerId: string,
    eventType: string,
    response: WebSocketResponseConfig,
  ): Promise<CliWebSocketEventResult>;
  setWebSocketListenerEventResponse(
    listenerId: string,
    eventType: string,
    response: WebSocketResponseConfig,
  ): Promise<CliWebSocketEventResult>;
};

export type ParsedArgs = {
  flags: Record<string, string | boolean>;
  positionals: string[];
};

export type JsonResult = { ok: boolean; [key: string]: unknown };

export type CliCommandContext = {
  session: CliSession;
  metadata?: Record<string, unknown>;
};

export type CliCommand = {
  name: string;
  usage: string;
  execute(context: CliCommandContext, args: ParsedArgs): Promise<JsonResult>;
};
