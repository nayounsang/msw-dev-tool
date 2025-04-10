import { HttpErrorStatusCode, HttpMethod } from "./http";
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

export type FlattenHandler = {
  id: string;
  path: string;
  method: HttpMethod;
  handler: HttpHandler;
  behavior: HttpHandlerBehavior;
  type: "temp" | "default";
};

export interface StorageData {
  flattenHandlers: FlattenHandler[];
}
