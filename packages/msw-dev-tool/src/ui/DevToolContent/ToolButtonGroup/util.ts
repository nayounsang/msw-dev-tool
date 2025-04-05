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
