import {
  AsyncResponseResolverReturnType,
  DefaultBodyType,
  RequestHandler,
  WebSocketHandler,
  HttpHandler as _HttpHandler,
  HttpResponseResolver,
} from "msw";

export type BehaviorResolverResult = AsyncResponseResolverReturnType<DefaultBodyType> | Response;

/**
 * To use private method: `resolver`.
 * Includes plain `Response` so `HttpResponse.error()` (network error) stays returnable.
 */
export type DevToolResponseResolver = (
  info: Parameters<HttpResponseResolver>[0],
) => BehaviorResolverResult | Promise<BehaviorResolverResult>;

export type HttpHandler = _HttpHandler & {
  resolver: DevToolResponseResolver;
};

export type Handler = RequestHandler | WebSocketHandler;
