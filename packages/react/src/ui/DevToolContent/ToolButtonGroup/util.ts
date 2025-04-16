export const getOptions = (enumObj: Record<string, string>) => {
  return Object.values(enumObj).map((value) => ({
    label: value,
    value: value,
  }));
};
