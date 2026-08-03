import { z } from "zod";
import {
  HttpHandlerBehavior,
  HttpMethod,
} from "../../shared/types";
import { tempHandlerSchema } from "../../shared/schema";

export const tempHandlerInputSchema = tempHandlerSchema;

export const serializableFlattenHandlerSchema = z.object({
  id: z.string(),
  path: z.string(),
  method: z.nativeEnum(HttpMethod),
  behavior: z.nativeEnum(HttpHandlerBehavior),
  type: z.enum(["temp", "default"]),
  tempInput: tempHandlerInputSchema.optional(),
});

export const sessionSnapshotSchema = z.object({
  revision: z.number(),
  flattenHandlers: z.array(serializableFlattenHandlerSchema),
  pendingReset: z.boolean().optional(),
});

export type SerializableFlattenHandler = z.infer<
  typeof serializableFlattenHandlerSchema
>;
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;

export const SESSION_POINTER_DIR = ".msw-dev-tool";
export const SESSION_POINTER_FILE = "session";
export const SESSION_ENV_KEY = "MSW_DEV_TOOL_SESSION";
