import {
  HttpHandlerBehavior,
  handlerSchema,
  readSessionSnapshot,
  listSnapshotHandlers,
  getSnapshotHandler,
  setSnapshotBehavior,
  addSnapshotTempHandler,
  removeSnapshotTempHandler,
  requestSnapshotReset,
} from "@msw-dev-tool/core/node/internal";
import { CliContext } from "../cli/context";
import { JsonResult } from "../cli/output";

const POST_WRITE_SETTLE_MS = 300;

const settleAfterWrite = () =>
  new Promise<void>((resolve) => setTimeout(resolve, POST_WRITE_SETTLE_MS));

export type CliCommand = {
  name: string;
  usage: string;
  execute: (context: CliContext, args: {
    positionals: string[];
    flags: Record<string, string | boolean>;
  }) => Promise<JsonResult>;
};

const parseBehavior = (value: string): HttpHandlerBehavior => {
  const matched = (Object.values(HttpHandlerBehavior) as Array<string | number>)
    .find((candidate) => String(candidate) === value);
  if (matched === undefined) {
    throw new Error(
      `Unknown behavior "${value}". Valid: ${Object.values(HttpHandlerBehavior).join(", ")}`
    );
  }
  return matched as HttpHandlerBehavior;
};

const commands: CliCommand[] = [
  {
    name: "session",
    usage: "session",
    async execute({ sessionPath }) {
      const snapshot = readSessionSnapshot(sessionPath);
      return {
        ok: true,
        sessionPath,
        revision: snapshot.revision,
        pendingReset: Boolean(snapshot.pendingReset),
        handlerCount: snapshot.flattenHandlers.length,
      };
    },
  },
  {
    name: "list",
    usage: "list",
    async execute({ sessionPath }) {
      return { ok: true, sessionPath, handlers: listSnapshotHandlers(sessionPath) };
    },
  },
  {
    name: "get",
    usage: "get <id>",
    async execute({ sessionPath }, { positionals }) {
      const id = positionals[1];
      if (!id) throw new Error("Usage: get <id>");
      const handler = getSnapshotHandler(sessionPath, id);
      if (!handler) throw new Error(`Handler not found for id: ${id}`);
      return { ok: true, sessionPath, handler };
    },
  },
  {
    name: "set-behavior",
    usage: "set-behavior <id> <behavior>",
    async execute({ sessionPath }, { positionals }) {
      const id = positionals[1];
      const behaviorRaw = positionals[2];
      if (!id || !behaviorRaw) {
        throw new Error("Usage: set-behavior <id> <behavior>");
      }
      const snapshot = setSnapshotBehavior(sessionPath, id, parseBehavior(behaviorRaw));
      await settleAfterWrite();
      return {
        ok: true,
        sessionPath,
        revision: snapshot.revision,
        handler: getSnapshotHandler(sessionPath, id),
      };
    },
  },
  {
    name: "add-temp",
    usage: "add-temp --json '<tempHandlerJson>'",
    async execute({ sessionPath }, { flags }) {
      const json = flags.json;
      if (typeof json !== "string") {
        throw new Error("Usage: add-temp --json '<tempHandlerJson>'");
      }
      const data = handlerSchema.parse(JSON.parse(json) as unknown);
      const snapshot = addSnapshotTempHandler(sessionPath, data);
      const id = snapshot.flattenHandlers.at(-1)?.id;
      await settleAfterWrite();
      return {
        ok: true,
        sessionPath,
        revision: snapshot.revision,
        handler: id ? getSnapshotHandler(sessionPath, id) : undefined,
      };
    },
  },
  {
    name: "remove-temp",
    usage: "remove-temp <id>",
    async execute({ sessionPath }, { positionals }) {
      const id = positionals[1];
      if (!id) throw new Error("Usage: remove-temp <id>");
      const snapshot = removeSnapshotTempHandler(sessionPath, id);
      await settleAfterWrite();
      return { ok: true, sessionPath, revision: snapshot.revision };
    },
  },
  {
    name: "reset",
    usage: "reset",
    async execute({ sessionPath }) {
      requestSnapshotReset(sessionPath);
      await settleAfterWrite();
      const after = readSessionSnapshot(sessionPath);
      return {
        ok: true,
        sessionPath,
        revision: after.revision,
        pendingReset: Boolean(after.pendingReset),
      };
    },
  },
];

export const findCommand = (name: string): CliCommand | undefined =>
  commands.find((command) => command.name === name);

export const commandUsage = (): string => commands.map((command) => `  ${command.usage}`).join("\n");
