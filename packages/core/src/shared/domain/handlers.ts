import {
  FlattenHandler,
  HttpHandlerBehavior,
} from "../types";

export const getFlattenHandlerById = (
  handlers: FlattenHandler[],
  id: string
): FlattenHandler | undefined => {
  return handlers.find((handler) => handler.id === id);
};

export const getHandlerBehavior = (
  handlers: FlattenHandler[],
  id: string
): HttpHandlerBehavior | undefined => {
  return getFlattenHandlerById(handlers, id)?.behavior;
};

export const setHandlerBehavior = (
  handlers: FlattenHandler[],
  id: string,
  behavior: HttpHandlerBehavior
): FlattenHandler[] => {
  return handlers.map((handler) =>
    handler.id === id ? { ...handler, behavior } : handler
  );
};

export const removeTempHandler = (
  handlers: FlattenHandler[],
  id: string
): FlattenHandler[] => {
  const handler = getFlattenHandlerById(handlers, id);
  if (!handler) {
    throw new Error(`Handler not found for the given id: ${id}`);
  }
  if (handler.type !== "temp") {
    throw new Error(
      `Handlers generated from codebase cannot be deleted (id: ${id}). You can only disable them.`
    );
  }
  return handlers.filter((h) => h.id !== id);
};

export const appendFlattenHandler = (
  handlers: FlattenHandler[],
  entry: FlattenHandler
): FlattenHandler[] => {
  return [...handlers, entry];
};
