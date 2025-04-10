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

export const getOptions = (enumObj: Record<string, string>) => {
  return Object.values(enumObj).map((value) => ({
    label: value,
    value: value,
  }));
};
