import { HttpHandler } from "../types";
import { httpHandlerSchema } from "../schema";

export const isHttpHandler = (handler: unknown): handler is HttpHandler =>
  httpHandlerSchema.safeParse(handler).success;

export const isValidJson = (input: string) => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};
