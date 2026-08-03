import { z } from "zod";
import { MimeType } from "../../shared/types";
import { getRowId } from "../../shared/utils/store";
import { tempHandlerSchema } from "../../shared/schema";
import { getStorageData } from "../storage";
import { isValidHtml, isValidXml } from "../validate";

export const handlerSchema = tempHandlerSchema
  .superRefine((data, ctx) => {
    if (!data.response) return;

    const mimeType = data.contentType;
    const defaultIssueData: z.IssueData = {
      code: z.ZodIssueCode.custom,
      message: `Invalid response body for ${mimeType}`,
      path: ["response"],
    };

    if (mimeType === MimeType.APPLICATION_XML) {
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
      const { flattenHandlers } = getStorageData();
      return !flattenHandlers.some((handler) => handler.id === id);
    },
    {
      message: "Duplicate handler. Change method or path.",
      path: ["path"],
    }
  );

export type HandlerSchema = z.infer<typeof handlerSchema>;
