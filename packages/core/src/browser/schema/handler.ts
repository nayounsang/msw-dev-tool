import { z } from "zod";
import { MimeType } from "../../shared/types";
import { getRowId } from "../../shared/utils/store";
import {
  httpResponseConfigSchema as sharedHttpResponseConfigSchema,
  tempHandlerSchema,
} from "../../shared/schema";
import { getStorageData } from "../storage";
import { isValidHtml, isValidXml } from "../validate";

const validateBrowserResponse = (
  data: { response?: string; contentType: MimeType },
  ctx: z.RefinementCtx,
) => {
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
};

export const httpResponseConfigSchema =
  sharedHttpResponseConfigSchema.superRefine(validateBrowserResponse);

export const handlerSchema = tempHandlerSchema.superRefine(validateBrowserResponse).refine(
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
  },
);

export type HandlerSchema = z.infer<typeof handlerSchema>;
