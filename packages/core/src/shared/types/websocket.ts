export type ManagedWebSocketEndpoint = {
  id: string;
  endpoint: string;
  source: "code";
};

export type ManagedWebSocketListener = {
  id: string;
  endpointId: string;
  order: number;
  event: "message";
  source: "code";
};

export type ManagedWebSocketRegistration = {
  endpoint: ManagedWebSocketEndpoint;
};
