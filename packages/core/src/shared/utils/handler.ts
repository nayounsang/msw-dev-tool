import { delay, HttpResponse, passthrough } from "msw";
import {
  BehaviorResolverResult,
  CustomResponse,
  CustomBehavior,
  HttpErrorStatusCode,
  HttpHandlerBehavior,
  STANDARD_HTTP_STATUS_TEXT,
} from "../types";

export type { BehaviorResolverResult };

type MaybeBehaviorResolverResult = BehaviorResolverResult | Promise<BehaviorResolverResult>;

const DEFAULT_HTTP_STATUS = 200;

const getDefaultStatusText = (status: number) => STANDARD_HTTP_STATUS_TEXT[status] ?? "";

export const getHandlerResponseByBehavior = async (
  behavior: HttpHandlerBehavior | undefined | string,
  originalResolverCallback: () => MaybeBehaviorResolverResult,
  customResponse?: CustomResponse,
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
      throw new Error("Please configure a custom response before using this behavior.");
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
        statusText: getDefaultStatusText(code),
      });
    }
  }

  return originalResolverCallback();
};
