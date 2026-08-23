import {
  CliHandler,
  CliMutationResult,
  CliSession,
  CliSessionInfo,
  CliWebSocketEndpointResult,
  CliWebSocketInfo,
  CliWebSocketListenerResult,
} from "@msw-dev-tool/cli-core";
import {
  BROWSER_CONTROL_KEY,
  CustomResponse,
  HttpHandlerBehavior,
  SerializableWebSocketMatcher,
  TempHandlerInput,
  WebSocketBehaviorSelection,
  WebSocketResponse,
  WebSocketRepeat,
  AddWebSocketListenerInput,
  WebSocketEndpointConfig,
} from "@msw-dev-tool/core/shared";
import { CdpClient } from "./cdp";

type RemoteResult = { result?: { value?: unknown }; exceptionDetails?: { text?: string; exception?: { description?: string } } };

const REQUIRED_BROWSER_CONTROL_METHOD_VERSIONS = {
  describe: 1,
  list: 1,
  get: 1,
  setBehavior: 1,
  setCustomResponse: 1,
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
  setWebSocketListenerCustomResponse: 1,
  setWebSocketListenerResponse: 1,
  setWebSocketListenerSchedule: 1,
} as const;

type BrowserControlMethod = keyof typeof REQUIRED_BROWSER_CONTROL_METHOD_VERSIONS;

const getCdpErrorMessage = (details: NonNullable<RemoteResult["exceptionDetails"]>) => {
  const description = details.exception?.description ?? details.text ?? "CDP evaluation failed";
  return description.split("\n")[0] || "CDP evaluation failed";
};

export class CdpBrowserCliSession implements CliSession {
  public constructor(private readonly client: CdpClient) {}
  private async invoke<T>(method: BrowserControlMethod, args: unknown[] = []): Promise<T> {
    const requiredVersion = REQUIRED_BROWSER_CONTROL_METHOD_VERSIONS[method];
    const unsupportedMethodMessage = `MSW Dev Tool browser control method "${method}" version ${requiredVersion} is unavailable. Update @msw-dev-tool/core.`;
    const expression = `(() => { const bridge = globalThis[${JSON.stringify(BROWSER_CONTROL_KEY)}]; if (!bridge) throw new Error("MSW Dev Tool browser session is not initialized in this tab. Call setupDevToolWorker() first."); if (bridge.methods?.[${JSON.stringify(method)}] !== ${requiredVersion} || typeof bridge[${JSON.stringify(method)}] !== "function") throw new Error(${JSON.stringify(unsupportedMethodMessage)}); return bridge[${JSON.stringify(method)}](...${JSON.stringify(args)}); })()`;
    const response = await this.client.call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }) as RemoteResult;
    if (response.exceptionDetails) throw new Error(getCdpErrorMessage(response.exceptionDetails));
    return response.result?.value as T;
  }
  public describe(): Promise<CliSessionInfo> { return this.invoke("describe"); }
  public list(): Promise<CliHandler[]> { return this.invoke("list"); }
  public get(id: string): Promise<CliHandler | undefined> { return this.invoke("get", [id]); }
  public setBehavior(id: string, behavior: HttpHandlerBehavior): Promise<CliMutationResult> { return this.invoke("setBehavior", [id, behavior]); }
  public setCustomResponse(id: string, response: CustomResponse): Promise<CliMutationResult> { return this.invoke("setCustomResponse", [id, response]); }
  public addTemp(data: TempHandlerInput): Promise<CliMutationResult> { return this.invoke("addTemp", [data]); }
  public removeTemp(id: string): Promise<CliSessionInfo> { return this.invoke("removeTemp", [id]); }
  public reset(): Promise<CliSessionInfo> { return this.invoke("reset"); }
  public listWebSocket(): Promise<WebSocketEndpointConfig[]> { return this.invoke("listWebSocket"); }
  public getWebSocketEndpoint(endpointId: string): Promise<WebSocketEndpointConfig | undefined> {
    return this.invoke("getWebSocketEndpoint", [endpointId]);
  }
  public addWebSocketEndpoint(matcher: SerializableWebSocketMatcher): Promise<CliWebSocketEndpointResult> {
    return this.invoke("addWebSocketEndpoint", [matcher]);
  }
  public removeWebSocketEndpoint(endpointId: string): Promise<CliWebSocketInfo> {
    return this.invoke("removeWebSocketEndpoint", [endpointId]);
  }
  public setWebSocketEndpointEnabled(endpointId: string, enabled: boolean): Promise<CliWebSocketEndpointResult> {
    return this.invoke("setWebSocketEndpointEnabled", [endpointId, enabled]);
  }
  public addWebSocketListener(input: AddWebSocketListenerInput): Promise<CliWebSocketListenerResult>;
  public addWebSocketListener(endpointId: string, behavior: WebSocketBehaviorSelection): Promise<CliWebSocketListenerResult>;
  public addWebSocketListener(inputOrEndpointId: AddWebSocketListenerInput | string, behavior?: WebSocketBehaviorSelection): Promise<CliWebSocketListenerResult> {
    return this.invoke("addWebSocketListener", [typeof inputOrEndpointId === "string" ? inputOrEndpointId : inputOrEndpointId, ...(typeof inputOrEndpointId === "string" ? [behavior] : [])]);
  }
  public removeWebSocketListener(listenerId: string): Promise<CliWebSocketInfo> {
    return this.invoke("removeWebSocketListener", [listenerId]);
  }
  public setWebSocketListenerEnabled(listenerId: string, enabled: boolean): Promise<CliWebSocketListenerResult> {
    return this.invoke("setWebSocketListenerEnabled", [listenerId, enabled]);
  }
  public setWebSocketListenerBehavior(listenerId: string, behavior: WebSocketBehaviorSelection): Promise<CliWebSocketListenerResult> {
    return this.invoke("setWebSocketListenerBehavior", [listenerId, behavior]);
  }
  public setWebSocketListenerCustomResponse(listenerId: string, response: WebSocketResponse): Promise<CliWebSocketListenerResult> {
    return this.invoke("setWebSocketListenerCustomResponse", [listenerId, response]);
  }
  public setWebSocketListenerResponse(listenerId: string, response: WebSocketResponse): Promise<CliWebSocketListenerResult> {
    return this.invoke("setWebSocketListenerResponse", [listenerId, response]);
  }
  public setWebSocketListenerSchedule(listenerId: string, input: { delay?: number; repeat?: WebSocketRepeat }): Promise<CliWebSocketListenerResult> {
    return this.invoke("setWebSocketListenerSchedule", [listenerId, input]);
  }
}
