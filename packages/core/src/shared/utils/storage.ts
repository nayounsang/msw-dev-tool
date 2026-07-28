import { StorageData } from "../types";

/**
 * Pure merge of saved storage data with handlers from the current runtime.
 */
export const mergeStorageData = (
  { flattenHandlers: newFlattenHandlers }: StorageData,
  saved: StorageData
) => {
  const { flattenHandlers: savedFlattenHandlers } = saved;

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

  savedFlattenHandlers.forEach((handler) => {
    if (handler.type === "temp") {
      flattenHandlers.push(handler);
    }
  });

  return { flattenHandlers };
};
