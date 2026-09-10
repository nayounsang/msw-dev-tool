import type { HttpResponseResolver } from "msw";
import { TemplateContext } from "./interpolation";

type ResolverInfo = Parameters<HttpResponseResolver>[0];

const isJsonContentType = (value: string | null): boolean => {
  const mediaType = value?.toLowerCase().split(";", 1)[0]?.trim();
  return mediaType === "application/json" || mediaType?.endsWith("+json") === true;
};

const queryToRecord = (url: URL): Record<string, string | string[]> => {
  const values = new Map<string, string[]>();
  url.searchParams.forEach((value, key) => {
    const entries = values.get(key) ?? [];
    entries.push(value);
    values.set(key, entries);
  });
  return Object.fromEntries(
    [...values].map(([key, entries]) => [key, entries.length === 1 ? entries[0] : entries]),
  );
};

const readBody = async (request: Request): Promise<unknown> => {
  if (!request.body) return undefined;
  try {
    const body = await request.clone().text();
    if (!isJsonContentType(request.headers.get("content-type"))) return body;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  } catch {
    return undefined;
  }
};

export const createHttpTemplateContext = async (args: ResolverInfo): Promise<TemplateContext> => {
  const url = new URL(args.request.url);
  const headers: Record<string, string> = {};
  args.request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return {
    request: {
      url: args.request.url,
      method: args.request.method,
      headers,
      query: queryToRecord(url),
      body: await readBody(args.request),
    },
    requestId: args.requestId,
    params: args.params,
    cookies: args.cookies,
  };
};
