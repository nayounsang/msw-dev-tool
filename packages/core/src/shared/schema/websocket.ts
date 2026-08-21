import { z } from "zod";
const webSocketInfoSchema = z.object({
  id: z.string(), kind: z.literal("websocket"), endpoint: z.string(), operation: z.string(), source: z.enum(["code", "temp"]),
});
export const webSocketSendOptionsSchema = z.object({ message: z.string() }).strict();
export const webSocketCloseOptionsSchema = z.object({
  code: z.number().int().refine(
    (code) => code === 1000 || (code >= 3000 && code <= 4999),
    "WebSocket close code must be 1000 or between 3000 and 4999"
  ).optional(),
  reason: z.string().refine(
    (reason) => new TextEncoder().encode(reason).byteLength <= 123,
    "WebSocket close reason must not exceed 123 UTF-8 bytes"
  ).optional(),
}).strict();
export const webSocketBehaviorSchema = z.union([
  z.object({ preset: z.literal("default") }).strict(),
  z.object({ preset: z.literal("send"), options: webSocketSendOptionsSchema }).strict(),
  z.object({ preset: z.literal("close"), options: webSocketCloseOptionsSchema.optional() }).strict(),
  z.object({ preset: z.literal("echo") }).strict(),
  z.object({ preset: z.literal("send-null") }).strict(),
  z.object({ preset: z.literal("no-reply") }).strict(),
  z.object({ preset: z.literal("send-sequence") }).strict(),
]);
export const serializableWebSocketMatcherSchema = z.union([
  z.object({ kind: z.literal("string"), value: z.string() }),
  z.object({ kind: z.literal("regexp"), source: z.string(), flags: z.string() }).superRefine(({ source, flags }, context) => {
    try {
      new RegExp(source, flags);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WebSocket regular-expression matcher must be valid",
      });
    }
  }),
]);
export const webSocketListenerSchema = z.object({
  info: webSocketInfoSchema, endpointId: z.string(), event: z.literal("message"), enabled: z.boolean(), behavior: webSocketBehaviorSchema,
});
export const webSocketEndpointSchema = z.object({
  info: webSocketInfoSchema, endpointId: z.string(), matcher: serializableWebSocketMatcherSchema, enabled: z.boolean(), listeners: z.array(webSocketListenerSchema),
});
export const webSocketEndpointsSchema = z.array(webSocketEndpointSchema);
