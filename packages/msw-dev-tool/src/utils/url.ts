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

/**
 * Create full URL string
 */
export const getTotalUrl = (origin: string, path: string): string => {
  return `${origin}${path}`;
};
