import { FlattenHandler, PersistedStorageData } from "../types";

export type HydratableFlattenHandler =
  | FlattenHandler
  | PersistedStorageData["flattenHandlers"][number];

/**
 * Pure merge of saved storage data with handlers from the current runtime.
 */
export const mergeStorageData = (
  { flattenHandlers: newFlattenHandlers }: { flattenHandlers: FlattenHandler[] },
  saved: PersistedStorageData
) => {
  const { flattenHandlers: savedFlattenHandlers } = saved;

  const flattenHandlers: HydratableFlattenHandler[] = newFlattenHandlers.map((newHandler) => {
    const savedHandler = savedFlattenHandlers.find(
      (h) => h.id === newHandler.id
    );
    if (savedHandler) {
      return {
        ...newHandler,
        behavior: savedHandler.behavior,
        type: savedHandler.type,
        customResponse: savedHandler.customResponse,
      };
    }
    return newHandler;
  });

  savedFlattenHandlers.forEach((handler) => {
    // Only restore temps that still have serializable input for rebuild.
    if (handler.type === "temp" && handler.tempInput) {
      flattenHandlers.push(handler);
    }
  });

  return { flattenHandlers };
};
