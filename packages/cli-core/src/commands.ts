import {
  customResponseSchema,
  HttpHandlerBehavior,
  tempHandlerSchema,
  webSocketBehaviorSchema,
  webSocketCustomResponseSchema,
  webSocketResponseSchema,
  webSocketRepeatSchema,
  serializableWebSocketMatcherSchema,
} from "@msw-dev-tool/core/shared";
import { z } from "zod";
import type { CliCommand, CliCommandContext, JsonResult } from "./types";
import type { AddWebSocketListenerInput } from "@msw-dev-tool/core/shared";

const parseBehavior = (value: string): HttpHandlerBehavior => {
  const behavior = (Object.values(HttpHandlerBehavior) as Array<string | number>).find(
    (candidate) => String(candidate) === value,
  );
  if (behavior === undefined) {
    throw new Error(
      `Unknown behavior "${value}". Valid: ${Object.values(HttpHandlerBehavior).join(", ")}`,
    );
  }
  return behavior as HttpHandlerBehavior;
};

const withMetadata = (result: JsonResult, context: CliCommandContext): JsonResult => ({
  ...result,
  ...(context.metadata ?? {}),
});

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
        context,
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
        {
          ok: true,
          ...(await context.session.setCustomResponse(id, parseCustomResponse(flags.json))),
        },
        context,
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
  {
    name: "ws-list",
    usage: "ws-list",
    async execute(context) {
      return withMetadata({ ok: true, endpoints: await context.session.listWebSocket() }, context);
    },
  },
  {
    name: "ws-get-endpoint",
    usage: "ws-get-endpoint <endpointId>",
    async execute(context, { positionals }) {
      const id = positionals[1];
      if (!id) throw new Error("Usage: ws-get-endpoint <endpointId>");
      const endpoint = await context.session.getWebSocketEndpoint(id);
      if (!endpoint) throw new Error(`WebSocket endpoint not found for id: ${id}`);
      return withMetadata({ ok: true, endpoint }, context);
    },
  },
  {
    name: "ws-add-endpoint",
    usage: "ws-add-endpoint --json '<matcherJson>'",
    async execute(context, { flags }) {
      if (typeof flags.json !== "string") {
        throw new Error("Usage: ws-add-endpoint --json '<matcherJson>'");
      }
      const matcher = serializableWebSocketMatcherSchema.parse(JSON.parse(flags.json) as unknown);
      return withMetadata(
        { ok: true, ...(await context.session.addWebSocketEndpoint(matcher)) },
        context,
      );
    },
  },
  {
    name: "ws-remove-endpoint",
    usage: "ws-remove-endpoint <endpointId>",
    async execute(context, { positionals }) {
      const id = positionals[1];
      if (!id) throw new Error("Usage: ws-remove-endpoint <endpointId>");
      return withMetadata(
        { ok: true, ...(await context.session.removeWebSocketEndpoint(id)) },
        context,
      );
    },
  },
  {
    name: "ws-set-endpoint-enabled",
    usage: "ws-set-endpoint-enabled <endpointId> <true|false>",
    async execute(context, { positionals }) {
      const [id, enabledStr] = [positionals[1], positionals[2]];
      if (!id || enabledStr === undefined)
        throw new Error("Usage: ws-set-endpoint-enabled <endpointId> <true|false>");
      if (enabledStr !== "true" && enabledStr !== "false")
        throw new Error("enabled must be true or false");
      return withMetadata(
        {
          ok: true,
          ...(await context.session.setWebSocketEndpointEnabled(id, enabledStr === "true")),
        },
        context,
      );
    },
  },
  {
    name: "ws-add-listener",
    usage: "ws-add-listener <endpointId> --json '<listenerJson>'",
    async execute(context, { flags, positionals }) {
      if (typeof flags.json !== "string") {
        throw new Error("Usage: ws-add-listener <endpointId> --json '<listenerJson>'");
      }
      const value = JSON.parse(flags.json) as Record<string, unknown>;
      const id =
        positionals[1] ?? (typeof value.endpointId === "string" ? value.endpointId : undefined);
      if (!id) throw new Error("Usage: ws-add-listener <endpointId> --json '<listenerJson>'");
      const legacyBehavior = webSocketBehaviorSchema.safeParse(value);
      if (legacyBehavior.success) {
        return withMetadata(
          { ok: true, ...(await context.session.addWebSocketListener(id, legacyBehavior.data)) },
          context,
        );
      }
      const input: AddWebSocketListenerInput = {
        endpointId: id,
        behavior:
          value.behavior === undefined ? undefined : webSocketBehaviorSchema.parse(value.behavior),
        response:
          value.response === undefined ? undefined : webSocketResponseSchema.parse(value.response),
        customResponse:
          value.customResponse === undefined
            ? undefined
            : webSocketResponseSchema.parse(value.customResponse),
        delay:
          value.delay === undefined ? undefined : z.number().int().nonnegative().parse(value.delay),
        repeat: value.repeat === undefined ? undefined : webSocketRepeatSchema.parse(value.repeat),
      };
      return withMetadata(
        { ok: true, ...(await context.session.addWebSocketListener(input)) },
        context,
      );
    },
  },
  {
    name: "ws-remove-listener",
    usage: "ws-remove-listener <listenerId>",
    async execute(context, { positionals }) {
      const id = positionals[1];
      if (!id) throw new Error("Usage: ws-remove-listener <listenerId>");
      return withMetadata(
        { ok: true, ...(await context.session.removeWebSocketListener(id)) },
        context,
      );
    },
  },
  {
    name: "ws-set-listener-enabled",
    usage: "ws-set-listener-enabled <listenerId> <true|false>",
    async execute(context, { positionals }) {
      const [id, enabledStr] = [positionals[1], positionals[2]];
      if (!id || enabledStr === undefined)
        throw new Error("Usage: ws-set-listener-enabled <listenerId> <true|false>");
      if (enabledStr !== "true" && enabledStr !== "false")
        throw new Error("enabled must be true or false");
      return withMetadata(
        {
          ok: true,
          ...(await context.session.setWebSocketListenerEnabled(id, enabledStr === "true")),
        },
        context,
      );
    },
  },
  {
    name: "ws-set-listener-behavior",
    usage: "ws-set-listener-behavior <listenerId> --json '<behaviorJson>'",
    async execute(context, { flags, positionals }) {
      const id = positionals[1];
      if (!id || typeof flags.json !== "string") {
        throw new Error("Usage: ws-set-listener-behavior <listenerId> --json '<behaviorJson>'");
      }
      const behavior = webSocketBehaviorSchema.parse(JSON.parse(flags.json) as unknown);
      return withMetadata(
        { ok: true, ...(await context.session.setWebSocketListenerBehavior(id, behavior)) },
        context,
      );
    },
  },
  {
    name: "ws-set-listener-custom-response",
    usage: "ws-set-listener-custom-response <listenerId> --json '<customResponseJson>'",
    async execute(context, { flags, positionals }) {
      const id = positionals[1];
      if (!id || typeof flags.json !== "string") {
        throw new Error(
          "Usage: ws-set-listener-custom-response <listenerId> --json '<customResponseJson>'",
        );
      }
      const response = webSocketCustomResponseSchema.parse(JSON.parse(flags.json) as unknown);
      return withMetadata(
        { ok: true, ...(await context.session.setWebSocketListenerCustomResponse(id, response)) },
        context,
      );
    },
  },
  {
    name: "ws-set-listener-response",
    usage: "ws-set-listener-response <listenerId> --json '<responseJson>'",
    async execute(context, { flags, positionals }) {
      const id = positionals[1];
      if (!id || typeof flags.json !== "string") {
        throw new Error("Usage: ws-set-listener-response <listenerId> --json '<responseJson>'");
      }
      const response = webSocketResponseSchema.parse(JSON.parse(flags.json) as unknown);
      return withMetadata(
        { ok: true, ...(await context.session.setWebSocketListenerResponse(id, response)) },
        context,
      );
    },
  },
  {
    name: "ws-set-listener-schedule",
    usage: "ws-set-listener-schedule <listenerId> --json '<scheduleJson>'",
    async execute(context, { flags, positionals }) {
      const id = positionals[1];
      if (!id || typeof flags.json !== "string") {
        throw new Error("Usage: ws-set-listener-schedule <listenerId> --json '<scheduleJson>'");
      }
      const value = JSON.parse(flags.json) as { delay?: unknown; repeat?: unknown };
      const input = {
        ...(value.delay === undefined
          ? {}
          : { delay: z.number().int().nonnegative().parse(value.delay) }),
        ...(value.repeat === undefined
          ? {}
          : {
              repeat: value.repeat === null ? undefined : webSocketRepeatSchema.parse(value.repeat),
            }),
      };
      return withMetadata(
        { ok: true, ...(await context.session.setWebSocketListenerSchedule(id, input)) },
        context,
      );
    },
  },
];

export const findCommand = (name: string) => commands.find((command) => command.name === name);

export const commandUsage = () => commands.map((command) => `  ${command.usage}`).join("\n");
