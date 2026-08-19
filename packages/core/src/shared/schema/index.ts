import { z } from "zod";
import { HttpMethod } from "../types";

export const rowIdSchema = z.object({
  path: z.string(),
  method: z.string(),
});

export type RowId = z.infer<typeof rowIdSchema>;

export const httpMethodSchema = z.nativeEnum(HttpMethod);

export const headerRecordSchema = z.record(z.string(), z.string());

export const httpHandlerSchema = z.object({
  info: z.object({
    method: z.string(),
    path: z.union([z.string(), z.instanceof(RegExp)]),
  }),
});

export {
  tempHandlerSchema,
  handlerSchema,
  customResponseSchema,
  isValidHandlerPath,
} from "./handler";
export type { TempHandlerSchema, HandlerSchema, CustomResponseSchema } from "./handler";
export { webSocketEndpointsSchema, webSocketEndpointSchema, webSocketListenerSchema, serializableWebSocketMatcherSchema, webSocketBehaviorSchema, webSocketSendOptionsSchema, webSocketCloseOptionsSchema } from "./websocket";
