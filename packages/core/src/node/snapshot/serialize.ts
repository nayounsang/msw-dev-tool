import { FlattenHandler } from "../../shared/types";
import { SerializableFlattenHandler, SessionSnapshot } from "./types";

export const toSerializableFlattenHandlers = (
  flattenHandlers: FlattenHandler[]
): SerializableFlattenHandler[] =>
  flattenHandlers.map(({ handler: _handler, ...rest }) => rest);

export const createEmptySnapshot = (revision = 0): SessionSnapshot => ({
  revision,
  flattenHandlers: [],
});

export const bumpSnapshot = (
  prev: SessionSnapshot,
  next: Partial<Pick<SessionSnapshot, "flattenHandlers" | "pendingReset">>
): SessionSnapshot => {
  const pendingReset =
    next.pendingReset === true
      ? true
      : next.pendingReset === false
        ? false
        : Boolean(prev.pendingReset);

  return {
    revision: prev.revision + 1,
    flattenHandlers: next.flattenHandlers ?? prev.flattenHandlers,
    ...(pendingReset ? { pendingReset: true } : {}),
  };
};
