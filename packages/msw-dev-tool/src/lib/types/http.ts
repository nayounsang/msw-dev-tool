import { getStringifyEnumObj, ValueUnion } from "./utils";

/**
 * Comment out rarely used status codes until the user requests them.
 */
export const HttpErrorStatusCode = {
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

export type HttpErrorStatusCode = ValueUnion<typeof HttpErrorStatusCode>;

export const HttpSuccessStatusCode = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
} as const;

export type HttpSuccessStatusCode = ValueUnion<typeof HttpSuccessStatusCode>;

/**
 * This is number status code to use in the msw logic.
 */
export const HttpStatusCode = {
  ...HttpSuccessStatusCode,
  ...HttpErrorStatusCode,
} as const;

export type HttpStatusCode = ValueUnion<typeof HttpStatusCode>;

/**
 * This is string status code to use in the form.
 */
export const StringHttpStatusCode = getStringifyEnumObj(HttpStatusCode);
export type StringHttpStatusCode = ValueUnion<typeof StringHttpStatusCode>;

export const HttpMethod = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
  PATCH: "patch",
  OPTIONS: "options",
  HEAD: "head",
} as const;
export type HttpMethod = ValueUnion<typeof HttpMethod>;

export const MimeType = {
  APPLICATION_JSON: "application/json",
  APPLICATION_XML: "application/xml",
  TEXT_PLAIN: "text/plain",
  TEXT_HTML: "text/html",
} as const;
export type MimeType = ValueUnion<typeof MimeType>;
