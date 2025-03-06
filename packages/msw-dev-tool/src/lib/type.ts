import { HttpHandler, RequestHandler, WebSocketHandler } from "msw";

export type ValueUnion<T> = T[keyof T];
export const HttpStatusCode = {
  // 4xx Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  CONFLICT: 409,
  GONE: 410,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Error
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
} as const;

export type HttpStatusCode = ValueUnion<typeof HttpStatusCode>;

export const HttpHandlerBehavior = {
  DEFAULT: "default",
  DELAY: "delay",
  RETURN_NULL:"return null",
  ...HttpStatusCode,
} as const;
export type HttpHandlerBehavior = ValueUnion<typeof HttpHandlerBehavior>;

export type FlattenHandler = {
  id: string;
  path: string;
  method: string;
  enabled: boolean;
  handler: HttpHandler;
  behavior: HttpHandlerBehavior;
};

export type Handler = RequestHandler | WebSocketHandler;
