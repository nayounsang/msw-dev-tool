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
import { interpolateJson, interpolateText, TemplateContext } from "../interpolation";

export type { BehaviorResolverResult };

type MaybeBehaviorResolverResult = BehaviorResolverResult | Promise<BehaviorResolverResult>;

const getDefaultStatusText = (status: number) => STANDARD_HTTP_STATUS_TEXT[status] ?? "";

export const hasHttpResponseTemplate = (config: HttpResponseConfig | undefined): boolean =>
  config !== undefined &&
  [config.response, config.header].some((value) => value?.includes("${{") === true);

const sanitizeHeaderValue = (value: string): string => value.replace(/[\r\n\0]/g, " ");

export const createHttpResponseFromConfig = async (
  config: HttpResponseConfig,
  context?: TemplateContext,
): Promise<HttpResponse> => {
  await delay(config.delay ?? 0);
  const status = Number(config.status);
  const customHeaders = config.header
    ? headerRecordSchema.parse(JSON.parse(config.header))
    : undefined;
  const renderedHeaders =
    context && customHeaders
      ? Object.fromEntries(
          Object.entries(customHeaders).map(([key, value]) => [
            key,
            sanitizeHeaderValue(interpolateText(value, context)),
          ]),
        )
      : customHeaders;
  const response =
    context && config.response !== undefined
      ? config.contentType === "application/json"
        ? config.response.includes("${{")
          ? interpolateJson(config.response, context)
          : config.response
        : interpolateText(config.response, context)
      : config.response;
  const contentLength =
    config.contentType === "application/json"
      ? new Blob(response === undefined ? [] : [response]).size.toString()
      : undefined;
  return new HttpResponse(response ?? null, {
    status,
    statusText: config.statusText ?? getDefaultStatusText(status),
    headers: {
      "Content-Type": config.contentType,
      ...(contentLength === undefined ? {} : { "Content-Length": contentLength }),
      ...renderedHeaders,
    },
  });
};

export const getHandlerResponseByBehavior = async (
  behavior: HttpHandlerBehavior | undefined | string,
  originalResolverCallback: () => MaybeBehaviorResolverResult,
  customResponse?: HttpResponseConfig,
  context?: TemplateContext,
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
    return createHttpResponseFromConfig(customResponse, context);
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
