import {
  HttpErrorStatusCode,
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "./http";
import { HttpHandler } from "./msw";
import { ValueUnion } from "./utils";

export const CustomBehavior = {
  DEFAULT: "default",
  DISABLE: "disable mock",
  DELAY: "delay",
  RETURN_NULL: "return null",
  NETWORK_ERROR: "network error",
} as const;
export type CustomBehavior = ValueUnion<typeof CustomBehavior>;

export const HttpHandlerBehavior = {
  ...CustomBehavior,
  ...HttpErrorStatusCode,
} as const;
export type HttpHandlerBehavior = ValueUnion<typeof HttpHandlerBehavior>;

/** Serializable input for rebuilding temporary handlers after persistence. */
export type TempHandlerInput = {
  path: string;
  delay?: number;
  contentType: MimeType;
  status: StringHttpStatusCode;
  statusText?: string;
  response?: string;
  method: HttpMethod;
  header?: string;
};

export type FlattenHandler = {
  id: string;
  path: string;
  method: HttpMethod;
  handler: HttpHandler;
  behavior: HttpHandlerBehavior;
  type: "temp" | "default";
  /** Present on temp handlers so they can be rebuilt after JSON persistence. */
  tempInput?: TempHandlerInput;
};

export interface StorageData {
  flattenHandlers: FlattenHandler[];
}
