import {
  getHandlerBehavior as findHandlerBehavior,
  rehydrateTempHandlers,
} from "../../shared/domain";
import { FlattenHandler } from "../../shared/types";
import {
  MswDevToolRuntime,
  registerTempHandlers,
} from "../../shared/store";
import { SerializableFlattenHandler, SessionSnapshot } from "./types";

export type FlattenHandlerSeed = Omit<FlattenHandler, "handler"> & {
  handler?: FlattenHandler["handler"];
};

const tempIdsSignature = (handlers: { id: string; type: string }[]) =>
  handlers
    .filter((h) => h.type === "temp")
    .map((h) => h.id)
    .sort()
    .join("|");

export const applySnapshotToRuntime = (args: {
  runtime: MswDevToolRuntime;
  current: FlattenHandler[];
  snapshot: SessionSnapshot;
}): FlattenHandler[] => {
  const { runtime, current, snapshot } = args;
  const currentById = new Map(current.map((h) => [h.id, h]));
  const snapshotIds = new Set(snapshot.flattenHandlers.map((h) => h.id));

  const seed: FlattenHandlerSeed[] = [];

  for (const entry of snapshot.flattenHandlers) {
    if (entry.type === "temp") {
      seed.push(serializableTempToSeed(entry));
      continue;
    }
    const existing = currentById.get(entry.id);
    if (!existing) continue;
    seed.push({
      ...existing,
      behavior: entry.behavior,
      type: entry.type,
      tempInput: entry.tempInput,
      customResponse: entry.customResponse,
    });
  }

  for (const handler of current) {
    if (handler.type === "default" && !snapshotIds.has(handler.id)) {
      seed.push(handler);
    }
  }

  const lookupBehavior = (id: string) =>
    snapshot.flattenHandlers.find((h) => h.id === id)?.behavior ??
    findHandlerBehavior(current, id);
  const lookupCustomResponse = (id: string) =>
    snapshot.flattenHandlers.find((h) => h.id === id)?.customResponse;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const seedAsHandlers = seed as FlattenHandler[];

  const next = rehydrateTempHandlers(
    seedAsHandlers,
    lookupBehavior,
    lookupCustomResponse
  ).map((h) => {
      const fromSnap = snapshot.flattenHandlers.find((s) => s.id === h.id);
      return fromSnap
        ? {
            ...h,
            behavior: fromSnap.behavior,
            customResponse: fromSnap.customResponse,
          }
        : h;
    });

  const tempsChanged =
    tempIdsSignature(current) !== tempIdsSignature(snapshot.flattenHandlers);

  if (tempsChanged) {
    runtime.resetHandlers();
    registerTempHandlers(runtime, next);
  }

  return next;
};

const serializableTempToSeed = (
  entry: SerializableFlattenHandler
): FlattenHandlerSeed => ({
  id: entry.id,
  path: entry.path,
  method: entry.method,
  behavior: entry.behavior,
  customResponse: entry.customResponse,
  type: "temp",
  tempInput: entry.tempInput,
});
