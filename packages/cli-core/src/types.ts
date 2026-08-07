import type {
  CustomResponse,
  HttpHandlerBehavior,
  PersistedFlattenHandler,
  TempHandlerInput,
} from "@msw-dev-tool/core";

export type CliHandler = PersistedFlattenHandler;

export type CliSessionInfo = {
  revision: number;
  pendingReset?: boolean;
  handlerCount: number;
};

export type CliMutationResult = CliSessionInfo & { handler: CliHandler };

export type CliSession = {
  describe(): Promise<CliSessionInfo>;
  list(): Promise<CliHandler[]>;
  get(id: string): Promise<CliHandler | undefined>;
  setBehavior(id: string, behavior: HttpHandlerBehavior): Promise<CliMutationResult>;
  setCustomResponse(id: string, response: CustomResponse): Promise<CliMutationResult>;
  addTemp(data: TempHandlerInput): Promise<CliMutationResult>;
  removeTemp(id: string): Promise<CliSessionInfo>;
  reset(): Promise<CliSessionInfo>;
};

export type ParsedArgs = {
  flags: Record<string, string | boolean>;
  positionals: string[];
};

export type JsonResult = { ok: boolean; [key: string]: unknown };

export type CliCommandContext = {
  session: CliSession;
  metadata?: Record<string, unknown>;
};

export type CliCommand = {
  name: string;
  usage: string;
  execute(context: CliCommandContext, args: ParsedArgs): Promise<JsonResult>;
};
