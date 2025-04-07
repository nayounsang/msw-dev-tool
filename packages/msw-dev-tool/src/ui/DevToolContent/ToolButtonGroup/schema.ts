import { z } from "zod";
import { isValidJson, isValidUrl, isValidXml, isValidHtml } from "./util";
import { HttpMethod, MimeType, HttpStatusCode } from "../../../lib/type";
import { isDuplicateHandler } from "../../../lib/handlerStore";
import { getRowId } from "../../../lib/util";

export const handlerSchema = z
  .object({
    path: z.string().refine(isValidUrl, {
      message: "Invalid URL format",
    }),
    delay: z.number().min(0),
    accept: z.nativeEnum(MimeType),
    status: z.nativeEnum(HttpStatusCode),
    response: z.string(),
    method: z.nativeEnum(HttpMethod),
    header: z
      .string()
      .refine((data) => isValidJson(data))
      .transform((data) => {
        return JSON.parse(data);
      }),
  })
  .refine(
    (data) => {
      const mimeType = data.accept;
      if (mimeType === MimeType.APPLICATION_JSON) {
        return isValidJson(data.response);
      }
      if (mimeType === MimeType.APPLICATION_XML) {
        return isValidXml(data.response);
      }
      if (mimeType === MimeType.TEXT_HTML) {
        return isValidHtml(data.response);
      }
      return true;
    },
    {
      message: "Invalid response body",
      path: ["response", "accept"],
    }
  )
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
      path: ["path", "method"],
    }
  );

export type HandlerSchema = z.infer<typeof handlerSchema>;
