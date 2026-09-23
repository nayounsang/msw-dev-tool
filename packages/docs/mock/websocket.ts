export const PLAYGROUND_WEBSOCKET_PATH = "/ws/playground";

export const getPlaygroundWebSocketUrl = (
  currentLocation: Pick<Location, "protocol" | "host"> = window.location,
) => {
  const protocol = currentLocation.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${currentLocation.host}${PLAYGROUND_WEBSOCKET_PATH}`;
};
