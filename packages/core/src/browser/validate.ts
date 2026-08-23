export const isValidUrl = (input: string) => {
  try {
    new URL(input, window.location.href);
    return true;
  } catch {
    return false;
  }
};

export const isValidMarkup = (input: string, mimeType: DOMParserSupportedType) => {
  try {
    new DOMParser().parseFromString(input, mimeType);
    return true;
  } catch {
    return false;
  }
};

export const isValidXml = (input: string) => {
  return isValidMarkup(input, "application/xml");
};

export const isValidHtml = (input: string) => {
  return isValidMarkup(input, "text/html");
};

export { isHttpHandler, isValidJson } from "../shared/utils/validate";
