import type { DevToolHandlerInfo } from "../types";

export type HandlerRegistryState = { handlers: DevToolHandlerInfo[] };

export const createHandlerRegistry = () => {
  let handlers: DevToolHandlerInfo[] = [];
  return {
    getState: (): HandlerRegistryState => ({ handlers }),
    registerHandler: (info: DevToolHandlerInfo) => {
      if (!handlers.some((entry) => entry.id === info.id)) handlers = [...handlers, info];
    },
    unregisterHandler: (id: string) => {
      handlers = handlers.filter((entry) => entry.id !== id);
    },
    getHandlerInfo: (id: string) => handlers.find((entry) => entry.id === id),
    listHandlerInfo: (kind?: "http" | "websocket") =>
      handlers.filter((entry) => !kind || entry.kind === kind),
    clearTempHandlers: (kind?: "http" | "websocket") => {
      handlers = handlers.filter(
        (entry) => entry.source !== "temp" || (kind !== undefined && entry.kind !== kind),
      );
    },
    replace: (next: DevToolHandlerInfo[]) => {
      handlers = next;
    },
  };
};
