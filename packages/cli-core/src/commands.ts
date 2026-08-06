import {
  customResponseSchema,
  HttpHandlerBehavior,
  tempHandlerSchema,
} from "@msw-dev-tool/core/shared";
import type { CliCommand, CliCommandContext, JsonResult } from "./types";

const parseBehavior = (value: string): HttpHandlerBehavior => {
  const behavior = (Object.values(HttpHandlerBehavior) as Array<string | number>)
    .find((candidate) => String(candidate) === value);
  if (behavior === undefined) {
    throw new Error(
      `Unknown behavior "${value}". Valid: ${Object.values(HttpHandlerBehavior).join(", ")}`
    );
  }
  return behavior as HttpHandlerBehavior;
};

const withMetadata = (
  result: JsonResult,
  context: CliCommandContext
): JsonResult => ({ ...result, ...(context.metadata ?? {}) });

const parseCustomResponse = (value: string) => {
  try {
    return customResponseSchema.parse(JSON.parse(value) as unknown);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Custom response must be valid JSON");
    }
    throw error;
  }
};

export const commands: CliCommand[] = [
  {
    name: "session",
    usage: "session",
    async execute(context) {
      return withMetadata({ ok: true, ...(await context.session.describe()) }, context);
    },
  },
  {
    name: "list",
    usage: "list",
    async execute(context) {
      return withMetadata({ ok: true, handlers: await context.session.list() }, context);
    },
  },
  {
    name: "get",
    usage: "get <id>",
    async execute(context, { positionals }) {
      const id = positionals[1];
      if (!id) throw new Error("Usage: get <id>");
      const handler = await context.session.get(id);
      if (!handler) throw new Error(`Handler not found for id: ${id}`);
      return withMetadata({ ok: true, handler }, context);
    },
  },
  {
    name: "set-behavior",
    usage: "set-behavior <id> <behavior>",
    async execute(context, { positionals }) {
      const [id, behavior] = [positionals[1], positionals[2]];
      if (!id || !behavior) throw new Error("Usage: set-behavior <id> <behavior>");
      return withMetadata(
        { ok: true, ...(await context.session.setBehavior(id, parseBehavior(behavior))) },
        context
      );
    },
  },
  {
    name: "set-custom-response",
    usage: "set-custom-response <id> --json '<customResponseJson>'",
    async execute(context, { flags, positionals }) {
      const id = positionals[1];
      if (!id || typeof flags.json !== "string") {
        throw new Error("Usage: set-custom-response <id> --json '<customResponseJson>'");
      }
      return withMetadata(
        { ok: true, ...(await context.session.setCustomResponse(id, parseCustomResponse(flags.json))) },
        context
      );
    },
  },
  {
    name: "add-temp",
    usage: "add-temp --json '<tempHandlerJson>'",
    async execute(context, { flags }) {
      if (typeof flags.json !== "string") {
        throw new Error("Usage: add-temp --json '<tempHandlerJson>'");
      }
      const data = tempHandlerSchema.parse(JSON.parse(flags.json) as unknown);
      return withMetadata({ ok: true, ...(await context.session.addTemp(data)) }, context);
    },
  },
  {
    name: "remove-temp",
    usage: "remove-temp <id>",
    async execute(context, { positionals }) {
      const id = positionals[1];
      if (!id) throw new Error("Usage: remove-temp <id>");
      return withMetadata({ ok: true, ...(await context.session.removeTemp(id)) }, context);
    },
  },
  {
    name: "reset",
    usage: "reset",
    async execute(context) {
      return withMetadata({ ok: true, ...(await context.session.reset()) }, context);
    },
  },
];

export const findCommand = (name: string) =>
  commands.find((command) => command.name === name);

export const commandUsage = () =>
  commands.map((command) => `  ${command.usage}`).join("\n");
