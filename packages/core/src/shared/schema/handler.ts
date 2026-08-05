import { z } from "zod";
import {
  HttpMethod,
  MimeType,
  StringHttpStatusCode,
} from "../types";

const bodylessStatusCodes = new Set([204, 205, 304]);

export const customResponseSchema = z
  .object({
    body: z.string().optional(),
    headers: z.record(z.string()).optional(),
    status: z.number().int().min(200).max(599).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status && bodylessStatusCodes.has(data.status) && data.body !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `HTTP ${data.status} responses cannot include a body`,
        path: ["body"],
      });
    }

    if (!data.headers) return;
    try {
      new Headers(data.headers);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid response headers",
        path: ["headers"],
      });
    }
  });

export type CustomResponseSchema = z.infer<typeof customResponseSchema>;

const isValidJson = (input: string) => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};

export const isValidHandlerPath = (input: string) => {
  if (!input.trim()) return false;
  try {
    new URL(input);
    return true;
  } catch {
    return input.startsWith("/") || input.includes("*") || input.includes(":");
  }
};

export const tempHandlerSchema = z
  .object({
    path: z
      .string()
      .min(1, { message: "Path is required" })
      .refine(isValidHandlerPath, {
        message: "Invalid URL or path format",
      }),
    delay: z.number().min(0, { message: "Invalid delay time" }).optional(),
    contentType: z.nativeEnum(MimeType),
    status: z.nativeEnum(StringHttpStatusCode),
    statusText: z.string().optional(),
    response: z.string().optional(),
    method: z.nativeEnum(HttpMethod),
    header: z
      .string()
      .optional()
      .refine((data) => (data ? isValidJson(data) : true), {
        message: "Invalid header",
      }),
  })
  .superRefine((data, ctx) => {
    if (!data.response) return;
    if (
      data.contentType === MimeType.APPLICATION_JSON &&
      !isValidJson(data.response)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid response body for ${data.contentType}`,
        path: ["response"],
      });
    }
  });

export type TempHandlerSchema = z.infer<typeof tempHandlerSchema>;

export const handlerSchema = tempHandlerSchema;
export type HandlerSchema = TempHandlerSchema;
