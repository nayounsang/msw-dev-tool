import { z } from "zod";
import { isValidJson, isValidUrl } from "./util";
import { HttpMethod } from "../../../lib/type";

export const handlerSchema = z.object({
  path: z.string().refine(isValidUrl, {
    message: "Invalid URL format",
  }),
  response: z.string().refine(isValidJson, { message: "Invalid JSON format" }),
  method: z.nativeEnum(HttpMethod),
});

export type HandlerSchema = z.infer<typeof handlerSchema>;
