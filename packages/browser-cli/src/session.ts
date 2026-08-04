import { CliHandler, CliMutationResult, CliSession, CliSessionInfo } from "@msw-dev-tool/cli-core";
import {
  BROWSER_CONTROL_KEY,
  BROWSER_CONTROL_PROTOCOL_VERSION,
  HttpHandlerBehavior,
  TempHandlerInput,
} from "@msw-dev-tool/core/shared";
import { CdpClient } from "./cdp";

type RemoteResult = { result?: { value?: unknown }; exceptionDetails?: { text?: string; exception?: { description?: string } } };

const getCdpErrorMessage = (details: NonNullable<RemoteResult["exceptionDetails"]>) => {
  const description = details.exception?.description ?? details.text ?? "CDP evaluation failed";
  return description.split("\n")[0] || "CDP evaluation failed";
};

export class CdpBrowserCliSession implements CliSession {
  public constructor(private readonly client: CdpClient) {}
  private async invoke<T>(method: string, args: unknown[] = []): Promise<T> {
    const expression = `(() => { const bridge = globalThis[${JSON.stringify(BROWSER_CONTROL_KEY)}]; if (!bridge) throw new Error("MSW Dev Tool browser session is not initialized in this tab. Call setupDevToolWorker() first."); if (bridge.version !== ${BROWSER_CONTROL_PROTOCOL_VERSION}) throw new Error("Incompatible MSW Dev Tool browser control protocol. Update @msw-dev-tool/core and @msw-dev-tool/browser-cli together."); return bridge[${JSON.stringify(method)}](...${JSON.stringify(args)}); })()`;
    const response = await this.client.call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }) as RemoteResult;
    if (response.exceptionDetails) throw new Error(getCdpErrorMessage(response.exceptionDetails));
    return response.result?.value as T;
  }
  public describe(): Promise<CliSessionInfo> { return this.invoke("describe"); }
  public list(): Promise<CliHandler[]> { return this.invoke("list"); }
  public get(id: string): Promise<CliHandler | undefined> { return this.invoke("get", [id]); }
  public setBehavior(id: string, behavior: HttpHandlerBehavior): Promise<CliMutationResult> { return this.invoke("setBehavior", [id, behavior]); }
  public addTemp(data: TempHandlerInput): Promise<CliMutationResult> { return this.invoke("addTemp", [data]); }
  public removeTemp(id: string): Promise<CliSessionInfo> { return this.invoke("removeTemp", [id]); }
  public reset(): Promise<CliSessionInfo> { return this.invoke("reset"); }
}
