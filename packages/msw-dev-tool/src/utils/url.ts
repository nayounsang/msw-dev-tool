import { PathParams } from "msw";

/**
 * Replace path parameters with path object and formatted path
 */
export const getPathWithParams = (
  url: URL,
  paramValues?: PathParams<string>
): string => {
  if (!paramValues) return url.pathname;

  return url.pathname
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        const paramName = segment.slice(1); // remove ':'
        return paramValues[paramName] || "undefined"; // replace with param value if exists, otherwise "undefined"
      }
      return segment;
    })
    .join("/");
};

export const getSearchParams = (
  searchParams?: Record<string, string>
): string => {
  if (!searchParams || Object.keys(searchParams).length === 0) return "";

  const urlSearchParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    urlSearchParams.set(key, value);
  });

  return urlSearchParams.toString();
};
/**
 * Create full URL string
 */
export const getTotalUrl = (
  origin: string,
  path: string,
  searchParams: string
): string => {
  const url = new URL(`${origin}${path}`);
  if (searchParams) {
    url.search = searchParams;
  }
  return url.toString();
};
