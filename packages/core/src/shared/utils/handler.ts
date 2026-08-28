import { delay, HttpResponse } from "msw";
import {
  BehaviorResolverResult,
  HttpResponseConfig,
  CustomBehavior,
  HttpErrorStatusCode,
  HttpHandlerBehavior,
  STANDARD_HTTP_STATUS_TEXT,
} from "../types";
import { headerRecordSchema } from "../schema";

export type { BehaviorResolverResult };

type MaybeBehaviorResolverResult = BehaviorResolverResult | Promise<BehaviorResolverResult>;

const getDefaultStatusText = (status: number) => STANDARD_HTTP_STATUS_TEXT[status] ?? "";

export const createHttpResponseFromConfig = async (
  config: HttpResponseConfig,
): Promise<HttpResponse> => {
  await delay(config.delay ?? 0);
  const status = Number(config.status);
  const customHeaders = config.header
    ? headerRecordSchema.parse(JSON.parse(config.header))
    : undefined;
  const contentLength =
    config.contentType === "application/json"
      ? new Blob(config.response === undefined ? [] : [config.response]).size.toString()
      : undefined;
  return new HttpResponse(config.response ?? null, {
    status,
    statusText: config.statusText ?? getDefaultStatusText(status),
    headers: {
      "Content-Type": config.contentType,
      ...(contentLength === undefined ? {} : { "Content-Length": contentLength }),
      ...customHeaders,
    },
  });
};

export const getHandlerResponseByBehavior = async (
  behavior: HttpHandlerBehavior | undefined | string,
  originalResolverCallback: () => MaybeBehaviorResolverResult,
  customResponse?: HttpResponseConfig,
): Promise<BehaviorResolverResult> => {
  if (!behavior || behavior === CustomBehavior.DEFAULT) {
    return originalResolverCallback();
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
      throw new Error("Please configure a custom response before using this behavior.");
    }
    return createHttpResponseFromConfig(customResponse);
  }

  for (const code of Object.values(HttpErrorStatusCode)) {
    if (behavior === code) {
      return new HttpResponse(null, {
        status: code,
        statusText: getDefaultStatusText(code),
      });
    }
  }

  return originalResolverCallback();
};
