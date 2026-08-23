import {
  addSnapshotTempHandler,
  addSnapshotWebSocketEndpoint,
  addSnapshotWebSocketListener,
  getSnapshotHandler,
  getSnapshotWebSocketEndpoint,
  listSnapshotHandlers,
  listSnapshotWebSocketEndpoints,
  readSnapshotOrEmpty,
  removeSnapshotTempHandler,
  removeSnapshotWebSocketEndpoint,
  removeSnapshotWebSocketListener,
  requestSnapshotReset,
  setSnapshotBehavior,
  setSnapshotCustomResponse,
  setSnapshotWebSocketEndpointEnabled,
  setSnapshotWebSocketListenerBehavior,
  setSnapshotWebSocketListenerCustomResponse,
  setSnapshotWebSocketListenerEnabled,
} from "@msw-dev-tool/core/node/internal";
import { CliSession } from "@msw-dev-tool/cli-core";

const POST_WRITE_SETTLE_MS = 300;
const settleAfterWrite = () => new Promise<void>((resolve) => setTimeout(resolve, POST_WRITE_SETTLE_MS));
const toInfo = (snapshot: { revision: number; state: { pendingReset?: boolean; flattenHandlers: unknown[] } }) => ({
  revision: snapshot.revision,
  pendingReset: Boolean(snapshot.state.pendingReset),
  handlerCount: snapshot.state.flattenHandlers.length,
});

/** File-backed adapter for Node snapshot envelopes. */
export class FileSnapshotCliSession implements CliSession {
  public constructor(private readonly sessionPath: string) {}
  public async describe() { return toInfo(await readSnapshotOrEmpty(this.sessionPath)); }
  public async list() { return listSnapshotHandlers(this.sessionPath); }
  public async get(id: string) { return getSnapshotHandler(this.sessionPath, id); }
  public async setBehavior(id: string, behavior: Parameters<typeof setSnapshotBehavior>[2]) {
    const snapshot = await setSnapshotBehavior(this.sessionPath, id, behavior);
    await settleAfterWrite();
    const handler = snapshot.state.flattenHandlers.find((entry) => entry.id === id);
    if (!handler) throw new Error(`Handler not found for id: ${id}`);
    return { ...toInfo(snapshot), handler };
  }
  public async setCustomResponse(id: string, response: Parameters<typeof setSnapshotCustomResponse>[2]) {
    const snapshot = await setSnapshotCustomResponse(this.sessionPath, id, response);
    await settleAfterWrite();
    const handler = snapshot.state.flattenHandlers.find((entry) => entry.id === id);
    if (!handler) throw new Error(`Handler not found for id: ${id}`);
    return { ...toInfo(snapshot), handler };
  }
  public async addTemp(data: Parameters<typeof addSnapshotTempHandler>[1]) {
    const snapshot = await addSnapshotTempHandler(this.sessionPath, data);
    await settleAfterWrite();
    const handler = snapshot.state.flattenHandlers.at(-1);
    if (!handler) throw new Error("Temporary handler was not added");
    return { ...toInfo(snapshot), handler };
  }
  public async removeTemp(id: string) {
    const snapshot = await removeSnapshotTempHandler(this.sessionPath, id);
    await settleAfterWrite();
    return toInfo(snapshot);
  }
  public async reset() {
    await requestSnapshotReset(this.sessionPath);
    await settleAfterWrite();
    return toInfo(await readSnapshotOrEmpty(this.sessionPath));
  }
  public listWebSocket() { return listSnapshotWebSocketEndpoints(this.sessionPath); }
  public getWebSocketEndpoint(endpointId: string) {
    return getSnapshotWebSocketEndpoint(this.sessionPath, endpointId);
  }
  public async addWebSocketEndpoint(matcher: Parameters<typeof addSnapshotWebSocketEndpoint>[1]) {
    const snapshot = await addSnapshotWebSocketEndpoint(this.sessionPath, matcher);
    await settleAfterWrite();
    return { endpoint: snapshot.state.webSocket!.at(-1)! };
  }
  public async removeWebSocketEndpoint(endpointId: string) {
    const snapshot = await removeSnapshotWebSocketEndpoint(this.sessionPath, endpointId);
    await settleAfterWrite();
    return { endpoints: snapshot.state.webSocket ?? [] };
  }
  public async setWebSocketEndpointEnabled(
    endpointId: string,
    enabled: boolean
  ) {
    const snapshot = await setSnapshotWebSocketEndpointEnabled(this.sessionPath, endpointId, enabled);
    await settleAfterWrite();
    return { endpoint: snapshot.state.webSocket!.find((endpoint) => endpoint.endpointId === endpointId)! };
  }
  public async addWebSocketListener(
    endpointId: string,
    behavior: Parameters<typeof addSnapshotWebSocketListener>[2]
  ) {
    const snapshot = await addSnapshotWebSocketListener(this.sessionPath, endpointId, behavior);
    await settleAfterWrite();
    const endpoint = snapshot.state.webSocket!.find((entry) => entry.endpointId === endpointId)!;
    return { endpoint, listener: endpoint.listeners.at(-1)! };
  }
  public async removeWebSocketListener(listenerId: string) {
    const snapshot = await removeSnapshotWebSocketListener(this.sessionPath, listenerId);
    await settleAfterWrite();
    return { endpoints: snapshot.state.webSocket ?? [] };
  }
  public async setWebSocketListenerEnabled(listenerId: string, enabled: boolean) {
    const snapshot = await setSnapshotWebSocketListenerEnabled(this.sessionPath, listenerId, enabled);
    await settleAfterWrite();
    const endpoint = snapshot.state.webSocket!.find((entry) =>
      entry.listeners.some((listener) => listener.info.id === listenerId)
    )!;
    return { endpoint, listener: endpoint.listeners.find((listener) => listener.info.id === listenerId)! };
  }
  public async setWebSocketListenerBehavior(
    listenerId: string,
    behavior: Parameters<typeof setSnapshotWebSocketListenerBehavior>[2]
  ) {
    const snapshot = await setSnapshotWebSocketListenerBehavior(this.sessionPath, listenerId, behavior);
    await settleAfterWrite();
    const endpoint = snapshot.state.webSocket!.find((entry) =>
      entry.listeners.some((listener) => listener.info.id === listenerId)
    )!;
    return { endpoint, listener: endpoint.listeners.find((listener) => listener.info.id === listenerId)! };
  }
  public async setWebSocketListenerCustomResponse(
    listenerId: string,
    response: Parameters<typeof setSnapshotWebSocketListenerCustomResponse>[2],
  ) {
    const snapshot = await setSnapshotWebSocketListenerCustomResponse(this.sessionPath, listenerId, response);
    await settleAfterWrite();
    const endpoint = snapshot.state.webSocket!.find((entry) =>
      entry.listeners.some((listener) => listener.info.id === listenerId)
    )!;
    return { endpoint, listener: endpoint.listeners.find((listener) => listener.info.id === listenerId)! };
  }
}
