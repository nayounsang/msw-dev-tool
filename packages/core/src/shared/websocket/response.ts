import type { WebSocketData } from "msw";
import type { WebSocketCustomResponse } from "../types";

export const CUSTOM_WEBSOCKET_RESPONSE_ERROR =
  "Please configure a custom response before using this behavior.";

export const parseWebSocketHex = (value: string): Uint8Array => {
  const tokens = value.trim().split(/\s+/);
  if (!value.trim() || tokens.some((token) => !/^[0-9a-fA-F]{2}$/.test(token))) {
    throw new Error("Binary WebSocket response must be a space-separated hexadecimal sequence");
  }
  return Uint8Array.from(tokens, (token) => Number.parseInt(token, 16));
};

export const toWebSocketSendData = (
  response: Extract<WebSocketCustomResponse, { type: "send" }>,
): WebSocketData => {
  if (response.dataType === "string") return response.value;
  const bytes = parseWebSocketHex(response.value);
  if (response.dataType === "ArrayBuffer") return bytes.buffer;
  return new Blob([bytes], response.metadata);
};
