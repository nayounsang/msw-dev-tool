import type { WebSocketData } from "msw";
import type { TemplateContext } from "../interpolation";

const parseJsonObjectOrArray = (data: WebSocketData): WebSocketData | object => {
  if (typeof data !== "string") return data;
  try {
    const parsed: unknown = JSON.parse(data);
    return typeof parsed === "object" && parsed !== null ? parsed : data;
  } catch {
    return data;
  }
};

/** Creates the template context available to a user-configured WebSocket response. */
export const createWebSocketTemplateContext = (
  event: MessageEvent<WebSocketData>,
): TemplateContext => ({
  event: { data: parseJsonObjectOrArray(event.data) },
});
