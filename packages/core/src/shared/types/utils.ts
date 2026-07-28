export type ValueUnion<T> = T[keyof T];
export type StringifyEnumValue<T> = T extends number
  ? `${T}`
  : T extends string
    ? T
    : never;

export type StringifyEnum<T extends Record<string, string | number>> = {
  [K in keyof T]: StringifyEnumValue<T[K]>;
};
