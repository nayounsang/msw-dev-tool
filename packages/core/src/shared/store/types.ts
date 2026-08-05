import { CustomResponse, FlattenHandler, Handler, HttpHandlerBehavior, TempHandlerInput } from "../types";
import type { HydratableFlattenHandler } from "../utils/storage";
import { ListHandlersRuntime } from "../utils";
import { PersistOptions, StoreApi } from "./createStore";

export type MswDevToolRuntime = ListHandlersRuntime & {
  use: (...handlers: Handler[]) => void;
  resetHandlers: () => void;
};

export type HandlerStoreBaseState = {
  /** GraphQL or WebSocket handlers are currently not supported. */
  restHandlers: unknown[];
  flattenHandlers: FlattenHandler[];
  resetMSWDevTool: () => void;
  addTempHandler: (handler: { data: TempHandlerInput }) => void;
  getFlattenHandlerById: (id: string) => FlattenHandler | undefined;
  getHandlerBehavior: (id: string) => HttpHandlerBehavior | undefined;
  setHandlerBehavior: (id: string, behavior: HttpHandlerBehavior) => void;
  getHandlerCustomResponse: (id: string) => CustomResponse | undefined;
  setHandlerCustomResponse: (id: string, response: CustomResponse) => void;
  removeTempHandler: (id: string) => void;
};

export type HandlerStoreInternalState<TRuntime extends MswDevToolRuntime> =
  HandlerStoreBaseState & {
    runtime: TRuntime | null;
    setupDevToolRuntime: (...handlers: Handler[]) => Promise<TRuntime>;
    getRuntime: () => TRuntime;
  };

export type CreateHandlerStoreOptions<TRuntime extends MswDevToolRuntime> = {
  createRuntime: (handlers: Handler[]) => TRuntime;
  mergeOnSetup?: (args: {
    flattenHandlers: FlattenHandler[];
    unsupportedHandlers: unknown[];
    runtime: TRuntime;
  }) => HydratableFlattenHandler[];
  onSetup?: (args: { runtime: TRuntime; flattenHandlers: FlattenHandler[] }) => void;
  persist?: PersistOptions<HandlerStoreInternalState<TRuntime>>;
};

export type HandlerStoreApi<TRuntime extends MswDevToolRuntime> = StoreApi<
  HandlerStoreInternalState<TRuntime>
>;
