import { z } from "zod";
import { HttpHandlerBehavior, HttpMethod } from "../../shared/types";
import { webSocketEndpointsSchema } from "../../shared/schema/websocket";
import { customResponseSchema, tempHandlerSchema } from "../../shared/schema";

export const tempHandlerInputSchema = tempHandlerSchema;

export const serializableFlattenHandlerSchema = z.object({
  id: z.string(),
  path: z.string(),
  method: z.nativeEnum(HttpMethod),
  behavior: z.nativeEnum(HttpHandlerBehavior),
  type: z.enum(["temp", "default"]),
  tempInput: tempHandlerInputSchema.optional(),
  customResponse: customResponseSchema.optional(),
});

export const sessionSnapshotSchema = z.object({
  revision: z.number(),
  state: z.object({
    flattenHandlers: z.array(serializableFlattenHandlerSchema),
    webSocket: webSocketEndpointsSchema.optional(),
    pendingReset: z.boolean().optional(),
  }),
  owner: z.object({ pid: z.number().int().nonnegative() }),
});

export type SerializableFlattenHandler = z.infer<typeof serializableFlattenHandlerSchema>;
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;

export const SESSION_DIR = ".msw-dev-tool";
export const SESSIONS_DIR = "sessions";
