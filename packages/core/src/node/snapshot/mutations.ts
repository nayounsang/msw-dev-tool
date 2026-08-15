import { getRowId } from "../../shared/utils/store";
import { CustomResponse, HttpHandlerBehavior, TempHandlerInput } from "../../shared/types";
import { bumpSnapshot } from "./serialize";
import { readSnapshotOrEmpty, withLockedMutation } from "./file";
import { SessionSnapshot, SerializableFlattenHandler } from "./types";

export const listSnapshotHandlers = async (sessionPath: string): Promise<SerializableFlattenHandler[]> =>
  (await readSnapshotOrEmpty(sessionPath)).state.flattenHandlers;

export const getSnapshotHandler = async (
  sessionPath: string,
  id: string
): Promise<SerializableFlattenHandler | undefined> =>
  (await listSnapshotHandlers(sessionPath)).find((handler) => handler.id === id);

export const setSnapshotBehavior = (
  sessionPath: string, id: string, behavior: HttpHandlerBehavior
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  if (!prev.state.flattenHandlers.some((handler) => handler.id === id)) throw new Error(`Handler not found for id: ${id}`);
  return bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers.map((handler) => handler.id === id ? { ...handler, behavior } : handler) });
});

export const setSnapshotCustomResponse = (
  sessionPath: string, id: string, customResponse: CustomResponse
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  if (!prev.state.flattenHandlers.some((handler) => handler.id === id)) throw new Error(`Handler not found for id: ${id}`);
  return bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers.map((handler) => handler.id === id ? { ...handler, customResponse } : handler) });
});

export const addSnapshotTempHandler = (
  sessionPath: string, data: TempHandlerInput
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const id = getRowId({ path: data.path, method: data.method });
  if (prev.state.flattenHandlers.some((handler) => handler.id === id)) throw new Error(`Duplicate handler id: ${id}. Change method or path.`);
  const entry: SerializableFlattenHandler = { id, path: data.path, method: data.method, behavior: HttpHandlerBehavior.DEFAULT, type: "temp", tempInput: data };
  return bumpSnapshot(prev, { flattenHandlers: [...prev.state.flattenHandlers, entry] });
});

export const removeSnapshotTempHandler = (
  sessionPath: string, id: string
): Promise<SessionSnapshot> => withLockedMutation(sessionPath, (prev) => {
  const target = prev.state.flattenHandlers.find((handler) => handler.id === id);
  if (!target) throw new Error(`Handler not found for the given id: ${id}`);
  if (target.type !== "temp") throw new Error(`Handlers generated from codebase cannot be deleted (id: ${id}). You can only disable them.`);
  return bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers.filter((handler) => handler.id !== id) });
});

export const requestSnapshotReset = (sessionPath: string): Promise<SessionSnapshot> =>
  withLockedMutation(sessionPath, (prev) => bumpSnapshot(prev, { flattenHandlers: prev.state.flattenHandlers, pendingReset: true }));

export const readSessionSnapshot = (sessionPath: string): Promise<SessionSnapshot> =>
  readSnapshotOrEmpty(sessionPath);
