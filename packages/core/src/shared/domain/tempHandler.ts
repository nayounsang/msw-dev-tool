import { delay, http, HttpResponse } from "msw";
import {
  FlattenHandler,
  HttpHandler,
  HttpHandlerBehavior,
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "../types";
import { getHandlerResponseByBehavior } from "../utils/handler";
import { getRowId } from "../utils/store";

/** Input shape for building a temporary handler (matches HandlerSchema fields). */
export type TempHandlerInput = {
  path: string;
  delay?: number;
  contentType: MimeType;
  status: StringHttpStatusCode;
  statusText?: string;
  response?: string;
  method: HttpMethod;
  header?: string;
};

export const buildTempHandler = (
  data: TempHandlerInput,
  getBehavior: (id: string) => HttpHandlerBehavior | undefined
): { handler: HttpHandler; flattenHandler: FlattenHandler } => {
  const {
    path,
    method,
    response,
    status,
    contentType,
    delay: responseDelay,
    statusText,
    header,
  } = data;

  const contentLength = {
    [MimeType.APPLICATION_JSON]: response
      ? new Blob([response]).size.toString()
      : "0",
  } as Record<MimeType, string>;

  const id = getRowId({ path, method });

  const headers = {
    "Content-Type": contentType,
    ...(contentLength?.[contentType]
      ? { "Content-Length": contentLength[contentType] }
      : {}),
    ...(header ? JSON.parse(header) : {}),
  };

  const res = new HttpResponse(response, {
    status: Number(status),
    statusText: statusText,
    headers,
  });

  const handler = http[method](path, async () => {
    const behavior = getBehavior(id);
    return await getHandlerResponseByBehavior(behavior, async () => {
      await delay(responseDelay);
      return res;
    });
  }) as HttpHandler;

  const flattenHandler: FlattenHandler = {
    id,
    path,
    method,
    handler,
    type: "temp",
    behavior: HttpHandlerBehavior.DEFAULT,
  };

  return { handler, flattenHandler };
};
