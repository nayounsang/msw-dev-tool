import { CustomResponse, HttpHandlerBehavior } from "./types";
import type { PersistedFlattenHandler, TempHandlerInput } from "./types";

/** Global property used by a CDP client to discover a configured browser session. */
export const BROWSER_CONTROL_KEY = "__MSW_DEV_TOOL_CONTROL__";

/** @deprecated Use method-level capability versions instead. */
export const BROWSER_CONTROL_PROTOCOL_VERSION = 2;

export const BROWSER_CONTROL_METHOD_VERSIONS = {
  describe: 1,
  list: 1,
  get: 1,
  setBehavior: 1,
  setCustomResponse: 1,
  addTemp: 1,
  removeTemp: 1,
  reset: 1,
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

export type BrowserControlBridge = {
  /** @deprecated Kept for compatibility with older Browser CLI versions. */
  version: typeof BROWSER_CONTROL_PROTOCOL_VERSION;
  methods: BrowserControlMethodVersions;
  describe: () => BrowserControlSessionInfo;
  list: () => PersistedFlattenHandler[];
  get: (id: string) => PersistedFlattenHandler | undefined;
  setBehavior: (id: string, behavior: HttpHandlerBehavior) => BrowserControlMutationResult;
  setCustomResponse: (id: string, response: CustomResponse) => BrowserControlMutationResult;
  addTemp: (data: TempHandlerInput) => BrowserControlMutationResult;
  removeTemp: (id: string) => BrowserControlSessionInfo;
  reset: () => BrowserControlSessionInfo;
};
