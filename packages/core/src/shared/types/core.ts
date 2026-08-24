import { HttpErrorStatusCode, HttpMethod, MimeType, StringHttpStatusCode } from "./http";
import { HttpHandler } from "./msw";
import { ValueUnion } from "./utils";
import type { WebSocketEndpointConfig } from "./websocket";

export const CustomBehavior = {
  DEFAULT: "default",
  DISABLE: "disable mock",
  DELAY: "delay",
  RETURN_NULL: "return null",
  NETWORK_ERROR: "network error",
  CUSTOM_RESPONSE: "custom response",
} as const;
export type CustomBehavior = ValueUnion<typeof CustomBehavior>;

export const HttpHandlerBehavior = {
  ...CustomBehavior,
  ...HttpErrorStatusCode,
} as const;
export type HttpHandlerBehavior = ValueUnion<typeof HttpHandlerBehavior>;

/** Serializable HTTP response settings shared by temporary and custom responses. */
export type HttpResponseConfig = {
  delay?: number;
  contentType: MimeType;
  status: StringHttpStatusCode;
  statusText?: string;
  response?: string;
  header?: string;
};

/** Serializable input for rebuilding temporary handlers after persistence. */
export type TempHandlerInput = HttpResponseConfig & {
  path: string;
  method: HttpMethod;
};

export type FlattenHandler = {
  id: string;
  path: string;
  method: HttpMethod;
  handler: HttpHandler;
  behavior: HttpHandlerBehavior;
  /** Response data used when the custom response behavior is selected. */
  customResponse?: HttpResponseConfig;
  type: "temp" | "default";
  /** Present on temp handlers so they can be rebuilt after JSON persistence. */
  tempInput?: TempHandlerInput;
};

/** A handler shape that can safely cross a persistence or CDP boundary. */
export type PersistedFlattenHandler = Omit<FlattenHandler, "handler">;

export interface StorageData {
  flattenHandlers: FlattenHandler[];
}

/** Browser storage intentionally excludes the non-serializable MSW handler. */
export interface PersistedStorageData {
  flattenHandlers: PersistedFlattenHandler[];
  webSocket?: WebSocketEndpointConfig[];
}
