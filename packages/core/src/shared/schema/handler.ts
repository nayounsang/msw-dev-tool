import { z } from "zod";
import { HttpMethod, MimeType, StringHttpStatusCode } from "../types";

const bodylessStatusCodes = new Set([204, 205, 304]);

const isValidJson = (input: string) => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};

export const httpResponseConfigSchema = z
  .object({
    delay: z.number().min(0, { message: "Invalid delay time" }).optional(),
    contentType: z.nativeEnum(MimeType),
    status: z.nativeEnum(StringHttpStatusCode),
    statusText: z.string().optional(),
    response: z.string().optional(),
    header: z
      .string()
      .optional()
      .refine((data) => (data ? isValidJson(data) : true), {
        message: "Invalid header",
      }),
  })
  .superRefine((data, ctx) => {
    const status = Number(data.status);
    if (bodylessStatusCodes.has(status) && data.response !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `HTTP ${data.status} responses cannot include a body`,
        path: ["response"],
      });
    }
    if (
      data.response &&
      data.contentType === MimeType.APPLICATION_JSON &&
      !isValidJson(data.response)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid response body for ${data.contentType}`,
        path: ["response"],
      });
    }
    if (!data.header) return;
    try {
      const headers = z.record(z.string()).parse(JSON.parse(data.header));
      new Headers(headers);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid response headers",
        path: ["header"],
      });
    }
  });

export type HttpResponseConfigSchema = z.infer<typeof httpResponseConfigSchema>;

export const isValidHandlerPath = (input: string) => {
  if (!input.trim()) return false;
  try {
    new URL(input);
    return true;
  } catch {
    return input.startsWith("/") || input.includes("*") || input.includes(":");
  }
};

export const tempHandlerSchema = z.intersection(
  httpResponseConfigSchema,
  z.object({
    path: z.string().min(1, { message: "Path is required" }).refine(isValidHandlerPath, {
      message: "Invalid URL or path format",
    }),
    method: z.nativeEnum(HttpMethod),
  }),
);

export type TempHandlerSchema = z.infer<typeof tempHandlerSchema>;

export const handlerSchema = tempHandlerSchema;
export type HandlerSchema = TempHandlerSchema;
