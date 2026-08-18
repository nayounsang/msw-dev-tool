import { z } from "zod";
const webSocketInfoSchema = z.object({
  id: z.string(), kind: z.literal("websocket"), endpoint: z.string(), operation: z.string(), source: z.enum(["code", "temp"]),
});
const webSocketBehaviorSchema = z.object({ preset: z.string(), options: z.unknown().optional() });
export const serializableWebSocketMatcherSchema = z.union([
  z.object({ kind: z.literal("string"), value: z.string() }),
  z.object({ kind: z.literal("regexp"), source: z.string(), flags: z.string() }),
]);
export const webSocketListenerSchema = z.object({
  info: webSocketInfoSchema, endpointId: z.string(), event: z.literal("message"), enabled: z.boolean(), behavior: webSocketBehaviorSchema,
});
export const webSocketEndpointSchema = z.object({
  info: webSocketInfoSchema, endpointId: z.string(), matcher: serializableWebSocketMatcherSchema, enabled: z.boolean(), listeners: z.array(webSocketListenerSchema),
});
export const webSocketEndpointsSchema = z.array(webSocketEndpointSchema);
