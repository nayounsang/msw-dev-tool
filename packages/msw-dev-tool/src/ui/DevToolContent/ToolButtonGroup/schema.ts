import { z } from "zod";
import { isValidJson, isValidUrl } from "./util";

export const handlerSchema = z.object({
  path: z.string().refine(isValidUrl, {
    message: "Invalid URL format",
  }),
  response: z.string().refine(isValidJson, { message: "Invalid JSON format" }),
});

export type HandlerSchema = z.infer<typeof handlerSchema>;
