import { getRowId } from "../../shared/utils/store";
import { CustomResponse, HttpHandlerBehavior, TempHandlerInput } from "../../shared/types";
import { bumpSnapshot } from "./serialize";
import { readSnapshotOrEmpty, withLockedMutation } from "./file";
import { SessionSnapshot, SerializableFlattenHandler } from "./types";

export const listSnapshotHandlers = (
  sessionPath: string
): SerializableFlattenHandler[] =>
  readSnapshotOrEmpty(sessionPath).flattenHandlers;

export const getSnapshotHandler = (
  sessionPath: string,
  id: string
): SerializableFlattenHandler | undefined =>
  listSnapshotHandlers(sessionPath).find((h) => h.id === id);

export const setSnapshotBehavior = (
  sessionPath: string,
  id: string,
  behavior: HttpHandlerBehavior
): SessionSnapshot =>
  withLockedMutation(sessionPath, (prev) => {
    const target = prev.flattenHandlers.find((h) => h.id === id);
    if (!target) {
      throw new Error(`Handler not found for id: ${id}`);
    }
    return bumpSnapshot(prev, {
      flattenHandlers: prev.flattenHandlers.map((h) =>
        h.id === id ? { ...h, behavior } : h
      ),
    });
  });

export const setSnapshotCustomResponse = (
  sessionPath: string,
  id: string,
  customResponse: CustomResponse
): SessionSnapshot =>
  withLockedMutation(sessionPath, (prev) => {
    const target = prev.flattenHandlers.find((h) => h.id === id);
    if (!target) {
      throw new Error(`Handler not found for id: ${id}`);
    }
    return bumpSnapshot(prev, {
      flattenHandlers: prev.flattenHandlers.map((h) =>
        h.id === id ? { ...h, customResponse } : h
      ),
    });
  });

export const addSnapshotTempHandler = (
  sessionPath: string,
  data: TempHandlerInput
): SessionSnapshot =>
  withLockedMutation(sessionPath, (prev) => {
    const id = getRowId({ path: data.path, method: data.method });
    if (prev.flattenHandlers.some((h) => h.id === id)) {
      throw new Error(`Duplicate handler id: ${id}. Change method or path.`);
    }
    const entry: SerializableFlattenHandler = {
      id,
      path: data.path,
      method: data.method,
      behavior: HttpHandlerBehavior.DEFAULT,
      type: "temp",
      tempInput: data,
    };
    return bumpSnapshot(prev, {
      flattenHandlers: [...prev.flattenHandlers, entry],
    });
  });

export const removeSnapshotTempHandler = (
  sessionPath: string,
  id: string
): SessionSnapshot =>
  withLockedMutation(sessionPath, (prev) => {
    const target = prev.flattenHandlers.find((h) => h.id === id);
    if (!target) {
      throw new Error(`Handler not found for the given id: ${id}`);
    }
    if (target.type !== "temp") {
      throw new Error(
        `Handlers generated from codebase cannot be deleted (id: ${id}). You can only disable them.`
      );
    }
    return bumpSnapshot(prev, {
      flattenHandlers: prev.flattenHandlers.filter((h) => h.id !== id),
    });
  });

export const requestSnapshotReset = (sessionPath: string): SessionSnapshot =>
  withLockedMutation(sessionPath, (prev) =>
    bumpSnapshot(prev, {
      flattenHandlers: prev.flattenHandlers,
      pendingReset: true,
    })
  );

export const readSessionSnapshot = (sessionPath: string): SessionSnapshot =>
  readSnapshotOrEmpty(sessionPath);
