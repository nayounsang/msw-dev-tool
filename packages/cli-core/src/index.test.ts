import { describe, expect, it } from "vitest";
import { CliHandler, CliSession, commands } from "./index";

const handler: CliHandler = { id: "a", path: "/a", method: "get", behavior: "default", type: "default" };
const createSession = (): CliSession => {
  const handlers = [handler];
  let revision = 0;
  const info = () => ({ revision, handlerCount: handlers.length });
  return {
    describe: async () => info(), list: async () => handlers, get: async (id) => handlers.find((item) => item.id === id),
    setBehavior: async (id, behavior) => { const item = handlers.find((entry) => entry.id === id); if (!item) throw new Error(`Handler not found for id: ${id}`); item.behavior = behavior; revision += 1; return { ...info(), handler: item }; },
    addTemp: async () => { throw new Error("not used"); }, removeTemp: async () => { throw new Error("not used"); }, reset: async () => info(),
  };
};

describe("shared CLI commands", () => {
  it("uses the session adapter and returns an updated handler", async () => {
    const command = commands.find((item) => item.name === "set-behavior")!;
    await expect(command.execute({ session: createSession() }, { flags: {}, positionals: ["set-behavior", "a", "delay"] })).resolves.toMatchObject({ ok: true, revision: 1, handler: { id: "a", behavior: "delay" } });
  });

  it("rejects a missing command argument before reaching the adapter", async () => {
    const command = commands.find((item) => item.name === "remove-temp")!;
    await expect(command.execute({ session: createSession() }, { flags: {}, positionals: ["remove-temp"] })).rejects.toThrow("Usage: remove-temp <id>");
  });
});
