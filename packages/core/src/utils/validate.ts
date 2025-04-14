import { handlerStore } from "../handlerStore";
import { Handler, HttpHandler } from "../types";

export const isHttpHandler = (handler: Handler): handler is HttpHandler => {
  return (
    "info" in handler && "method" in handler.info && "path" in handler.info
  );
};

export const isValidUrl = (input: string) => {
  try {
    new URL(input, window.location.href);
    return true;
  } catch (error) {
    return false;
  }
};

export const isValidJson = (input: string) => {
  try {
    JSON.parse(input);
    return true;
  } catch (error) {
    return false;
  }
};

export const isValidMarkup = (
  input: string,
  mimeType: DOMParserSupportedType
) => {
  try {
    new DOMParser().parseFromString(input, mimeType);
    return true;
  } catch (error) {
    return false;
  }
};

export const isValidXml = (input: string) => {
  return isValidMarkup(input, "application/xml");
};

export const isValidHtml = (input: string) => {
  return isValidMarkup(input, "text/html");
};
