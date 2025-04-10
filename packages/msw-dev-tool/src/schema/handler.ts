import { z } from "zod";
import {
  isValidJson,
  isValidUrl,
  isValidXml,
  isValidHtml,
} from "../ui/DevToolContent/ToolButtonGroup/util";
import { HttpMethod, MimeType, StringHttpStatusCode } from "../lib/types";
import { isDuplicateHandler } from "../lib/handlerStore";
import { getRowId } from "../lib/utils";

export const handlerSchema = z
  .object({
    path: z
      .string()
      .min(1, { message: "Path is required" })
      .refine(isValidUrl, {
        message: "Invalid URL format",
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
    const mimeType = data.contentType;

    const defaultIssueData: z.IssueData = {
      code: z.ZodIssueCode.custom,
      message: `Invalid response body for ${mimeType}`,
      path: ["response"],
    };

    if (!data.response) {
      return;
    }

    if (mimeType === MimeType.APPLICATION_JSON) {
      if (!isValidJson(data.response)) {
        ctx.addIssue(defaultIssueData);
      }
    } else if (mimeType === MimeType.APPLICATION_XML) {
      if (!isValidXml(data.response)) {
        ctx.addIssue(defaultIssueData);
      }
    } else if (mimeType === MimeType.TEXT_HTML) {
      if (!isValidHtml(data.response)) {
        ctx.addIssue(defaultIssueData);
      }
    }
  })
  .refine(
    (data) => {
      const id = getRowId({
        path: data.path,
        method: data.method,
      });
      return !isDuplicateHandler(id);
    },
    {
      message: "Duplicate handler. Change method or path.",
      path: ["path"],
    }
  );
export type HandlerSchema = z.infer<typeof handlerSchema>;
