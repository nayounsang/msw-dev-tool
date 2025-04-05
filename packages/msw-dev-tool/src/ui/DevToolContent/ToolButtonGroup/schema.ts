import { z } from "zod";
import { isValidJson, isValidUrl } from "./util";
import { HttpMethod } from "../../../lib/type";
import { isDuplicateHandler } from "../../../lib/handlerStore";
import { getRowId } from "../../../lib/util";

export const handlerSchema = z
  .object({
    path: z.string().refine(isValidUrl, {
      message: "Invalid URL format",
    }),
    response: z
      .string()
      .refine(isValidJson, { message: "Invalid JSON format" }),
    method: z.nativeEnum(HttpMethod),
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
      path: ["path", "method"],
    }
  );

export type HandlerSchema = z.infer<typeof handlerSchema>;
