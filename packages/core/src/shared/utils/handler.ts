import { delay, HttpResponse, passthrough } from "msw";
import {
  BehaviorResolverResult,
  CustomBehavior,
  HttpErrorStatusCode,
  HttpHandlerBehavior,
} from "../types";

export type { BehaviorResolverResult };

type MaybeBehaviorResolverResult =
  | BehaviorResolverResult
  | PromiseLike<BehaviorResolverResult>;

export const getHandlerResponseByBehavior = async (
  behavior: HttpHandlerBehavior | undefined | string,
  originalResolverCallback: () => MaybeBehaviorResolverResult
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
