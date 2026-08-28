import { FlattenHandler } from "../../shared/types";
import { SerializableFlattenHandler, SessionSnapshot } from "./types";

export const toSerializableFlattenHandlers = (
  flattenHandlers: FlattenHandler[],
): SerializableFlattenHandler[] => flattenHandlers.map(({ handler: _handler, ...rest }) => rest);

export const createEmptySnapshot = (revision = 0): SessionSnapshot => ({
  revision,
  state: { flattenHandlers: [], webSocket: [], mockEnabled: true },
  owner: { pid: process.pid },
});

export const bumpSnapshot = (
  prev: SessionSnapshot,
  next: Partial<SessionSnapshot["state"]>,
): SessionSnapshot => {
  const pendingReset =
    next.pendingReset === true
      ? true
      : next.pendingReset === false
        ? false
        : Boolean(prev.state.pendingReset);

  return {
    revision: prev.revision + 1,
    state: {
      flattenHandlers: next.flattenHandlers ?? prev.state.flattenHandlers,
      webSocket: next.webSocket ?? prev.state.webSocket,
      mockEnabled: next.mockEnabled ?? prev.state.mockEnabled ?? true,
      ...(pendingReset ? { pendingReset: true } : {}),
    },
    owner: prev.owner,
  };
};
