import {
  CustomResponse,
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

export const getHandlerCustomResponse = (
  handlers: FlattenHandler[],
  id: string
): CustomResponse | undefined => getFlattenHandlerById(handlers, id)?.customResponse;

export const setHandlerBehavior = (
  handlers: FlattenHandler[],
  id: string,
  behavior: HttpHandlerBehavior
): FlattenHandler[] => {
  return handlers.map((handler) =>
    handler.id === id ? { ...handler, behavior } : handler
  );
};

export const setHandlerCustomResponse = (
  handlers: FlattenHandler[],
  id: string,
  customResponse: CustomResponse
): FlattenHandler[] =>
  handlers.map((handler) =>
    handler.id === id ? { ...handler, customResponse } : handler
  );

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
  if (handlers.some((handler) => handler.id === entry.id)) {
    throw new Error(
      `Duplicate handler id: ${entry.id}. Change method or path.`
    );
  }
  return [...handlers, entry];
};
