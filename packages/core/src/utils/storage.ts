import { STORAGE_KEY } from "../const";
import { StorageData } from "../types";

export const getStorageData = (): StorageData => {
  const storage = sessionStorage.getItem(STORAGE_KEY);
  if (!storage) return { flattenHandlers: [] };
  return JSON.parse(storage).state;
};

export const mergeStorageData = ({
  flattenHandlers: newFlattenHandlers,
}: StorageData) => {
  const { flattenHandlers: savedFlattenHandlers } = getStorageData();

  // Merge with saved and new element based on worker's default handlers
  const flattenHandlers = newFlattenHandlers.map((newHandler) => {
    const savedHandler = savedFlattenHandlers.find(
      (h) => h.id === newHandler.id
    );
    if (savedHandler) {
      return {
        ...newHandler,
        behavior: savedHandler.behavior,
        type: savedHandler.type,
      };
    }
    return newHandler;
  });

  // Merge with temp handlers
  savedFlattenHandlers.forEach((handler) => {
    if (handler.type === "temp") {
      flattenHandlers.push(handler);
    }
  });

  return { flattenHandlers };
};
