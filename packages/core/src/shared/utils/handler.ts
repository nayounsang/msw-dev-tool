import { delay, HttpResponse, passthrough } from "msw";
import {
  BehaviorResolverResult,
  CustomResponse,
  CustomBehavior,
  HttpErrorStatusCode,
  HttpHandlerBehavior,
} from "../types";

export type { BehaviorResolverResult };

type MaybeBehaviorResolverResult =
  | BehaviorResolverResult
  | Promise<BehaviorResolverResult>;

const DEFAULT_HTTP_STATUS = 200;

const STANDARD_HTTP_STATUS_TEXT: Record<number, string> = {
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

const getDefaultStatusText = (status: number) =>
  STANDARD_HTTP_STATUS_TEXT[status] ?? "";

export const getHandlerResponseByBehavior = async (
  behavior: HttpHandlerBehavior | undefined | string,
  originalResolverCallback: () => MaybeBehaviorResolverResult,
  customResponse?: CustomResponse
): Promise<BehaviorResolverResult> => {
  if (!behavior || behavior === CustomBehavior.DEFAULT) {
    return originalResolverCallback();
  }

  if (behavior === CustomBehavior.DISABLE) {
    return passthrough();
  }

  if (behavior === CustomBehavior.DELAY) {
    await delay("infinite");
    return new HttpResponse(null);
  }

  if (behavior === CustomBehavior.RETURN_NULL) {
    return HttpResponse.json(null, { status: 200 });
  }

  if (behavior === CustomBehavior.NETWORK_ERROR) {
    return HttpResponse.error();
  }

  if (behavior === CustomBehavior.CUSTOM_RESPONSE) {
    if (!customResponse) {
      throw new Error(
        "Please configure a custom response before using this behavior."
      );
    }
    const status = customResponse.status ?? DEFAULT_HTTP_STATUS;
    return new HttpResponse(customResponse.body ?? null, {
      status,
      statusText: getDefaultStatusText(status),
      headers: customResponse.headers,
    });
  }

  for (const code of Object.values(HttpErrorStatusCode)) {
    if (behavior === code) {
      return new HttpResponse(null, {
        status: code,
        statusText: `${code} triggered by dev tools.`,
      });
    }
  }

  return originalResolverCallback();
};
