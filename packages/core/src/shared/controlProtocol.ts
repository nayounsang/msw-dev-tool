import { CustomResponse, HttpHandlerBehavior } from "./types";
import type { PersistedFlattenHandler, TempHandlerInput } from "./types";

/** Global property used by a CDP client to discover a configured browser session. */
export const BROWSER_CONTROL_KEY = "__MSW_DEV_TOOL_CONTROL__";
export const BROWSER_CONTROL_PROTOCOL_VERSION = 2;

export type BrowserControlSessionInfo = {
  revision: number;
  handlerCount: number;
};

export type BrowserControlMutationResult = BrowserControlSessionInfo & {
  handler: PersistedFlattenHandler;
};

export type BrowserControlBridge = {
  version: typeof BROWSER_CONTROL_PROTOCOL_VERSION;
  describe: () => BrowserControlSessionInfo;
  list: () => PersistedFlattenHandler[];
  get: (id: string) => PersistedFlattenHandler | undefined;
  setBehavior: (id: string, behavior: HttpHandlerBehavior) => BrowserControlMutationResult;
  setCustomResponse: (id: string, response: CustomResponse) => BrowserControlMutationResult;
  addTemp: (data: TempHandlerInput) => BrowserControlMutationResult;
  removeTemp: (id: string) => BrowserControlSessionInfo;
  reset: () => BrowserControlSessionInfo;
};
