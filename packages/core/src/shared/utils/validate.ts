import { Handler, HttpHandler } from "../types";

export const isHttpHandler = (handler: Handler): handler is HttpHandler => {
  return (
    "info" in handler && "method" in handler.info && "path" in handler.info
  );
};

export const isValidJson = (input: string) => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};
