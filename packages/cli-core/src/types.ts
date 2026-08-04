import type { HttpHandlerBehavior, TempHandlerInput } from "@msw-dev-tool/core/shared";

export type CliHandler = {
  id: string;
  path: string;
  method: string;
  behavior: HttpHandlerBehavior;
  type: "temp" | "default";
  tempInput?: TempHandlerInput;
};

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
