export const deleteEmptySet = <K, T>(map: Map<K, Set<T>>, key: K, values: Set<T>) => {
  if (values.size === 0) map.delete(key);
};
