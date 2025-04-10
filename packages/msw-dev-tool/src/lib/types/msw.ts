import { PathParams, RequestHandler, ResponseResolver,WebSocketHandler,HttpHandler as _HttpHandler } from "msw";

export type HttpRequestResolverExtras<Params extends PathParams> = {
  params: Params;
  cookies: Record<string, string>;
};

/**
 * To use private method: `resolver`.
 */
export type HttpHandler = _HttpHandler & {
  resolver: ResponseResolver<HttpRequestResolverExtras<any>, any, any>;
};

export type Handler = RequestHandler | WebSocketHandler;