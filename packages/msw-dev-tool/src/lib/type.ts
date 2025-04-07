import {
  HttpHandler as _HttpHandler,
  PathParams,
  RequestHandler,
  ResponseResolver,
  WebSocketHandler,
} from "msw";

export type HttpRequestResolverExtras<Params extends PathParams> = {
  params: Params;
  cookies: Record<string, string>;
};

export type ValueUnion<T> = T[keyof T];

/**
 * Comment out rarely used status codes until the user requests them.
 */
export const HttpStatusCode = {
  // 4xx Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  //PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  CONFLICT: 409,
  //GONE: 410,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  //RANGE_NOT_SATISFIABLE: 416,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Error
  INTERNAL_SERVER_ERROR: 500,
  //NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  //HTTP_VERSION_NOT_SUPPORTED: 505,
} as const;

export type HttpStatusCode = ValueUnion<typeof HttpStatusCode>;

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
  ...HttpStatusCode,
} as const;
export type HttpHandlerBehavior = ValueUnion<typeof HttpHandlerBehavior>;

/**
 * To use private method: `resolver`.
 */
export type HttpHandler = _HttpHandler & {
  resolver: ResponseResolver<HttpRequestResolverExtras<any>, any, any>;
};

export type FlattenHandler = {
  id: string;
  path: string;
  method: HttpMethod;
  handler: HttpHandler;
  behavior: HttpHandlerBehavior;
  type: "temp" | "default";
};

export type Handler = RequestHandler | WebSocketHandler;

export interface StorageData {
  flattenHandlers: FlattenHandler[];
}

export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
  TRACE: "TRACE",
  CONNECT: "CONNECT",
} as const;
export type HttpMethod = ValueUnion<typeof HttpMethod>;

export const MimeType = {
  APPLICATION_JSON: "application/json",
  APPLICATION_XML: "application/xml",
  TEXT_PLAIN: "text/plain",
  TEXT_HTML: "text/html",
} as const;
export type MimeType = ValueUnion<typeof MimeType>;
