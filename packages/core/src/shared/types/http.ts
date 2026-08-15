import { ValueUnion } from "./utils";

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

/** Standard reason phrases for HTTP response status codes. */
export const STANDARD_HTTP_STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Content Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  421: "Misdirected Request",
  422: "Unprocessable Content",
  423: "Locked",
  424: "Failed Dependency",
  425: "Too Early",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
};

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
export const StringHttpStatusCode = {
  OK: `${HttpStatusCode.OK}`,
  CREATED: `${HttpStatusCode.CREATED}`,
  ACCEPTED: `${HttpStatusCode.ACCEPTED}`,
  NO_CONTENT: `${HttpStatusCode.NO_CONTENT}`,
  BAD_REQUEST: `${HttpStatusCode.BAD_REQUEST}`,
  UNAUTHORIZED: `${HttpStatusCode.UNAUTHORIZED}`,
  FORBIDDEN: `${HttpStatusCode.FORBIDDEN}`,
  NOT_FOUND: `${HttpStatusCode.NOT_FOUND}`,
  METHOD_NOT_ALLOWED: `${HttpStatusCode.METHOD_NOT_ALLOWED}`,
  NOT_ACCEPTABLE: `${HttpStatusCode.NOT_ACCEPTABLE}`,
  CONFLICT: `${HttpStatusCode.CONFLICT}`,
  PRECONDITION_FAILED: `${HttpStatusCode.PRECONDITION_FAILED}`,
  PAYLOAD_TOO_LARGE: `${HttpStatusCode.PAYLOAD_TOO_LARGE}`,
  UNSUPPORTED_MEDIA_TYPE: `${HttpStatusCode.UNSUPPORTED_MEDIA_TYPE}`,
  TOO_MANY_REQUESTS: `${HttpStatusCode.TOO_MANY_REQUESTS}`,
  INTERNAL_SERVER_ERROR: `${HttpStatusCode.INTERNAL_SERVER_ERROR}`,
  BAD_GATEWAY: `${HttpStatusCode.BAD_GATEWAY}`,
  SERVICE_UNAVAILABLE: `${HttpStatusCode.SERVICE_UNAVAILABLE}`,
  GATEWAY_TIMEOUT: `${HttpStatusCode.GATEWAY_TIMEOUT}`,
} as const;
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
