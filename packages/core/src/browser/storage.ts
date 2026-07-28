import { STORAGE_KEY } from "../shared/const";
import { StorageData } from "../shared/types";
import { mergeStorageData as mergeStorageDataPure } from "../shared/utils/storage";

export const getStorageData = (): StorageData => {
  const storage = sessionStorage.getItem(STORAGE_KEY);
  if (!storage) return { flattenHandlers: [] };
  return JSON.parse(storage).state;
};

export const mergeStorageData = ({
  flattenHandlers: newFlattenHandlers,
}: StorageData) => {
  return mergeStorageDataPure(
    { flattenHandlers: newFlattenHandlers },
    getStorageData()
  );
};
