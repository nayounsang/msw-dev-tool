import {
  addSnapshotTempHandler,
  getSnapshotHandler,
  listSnapshotHandlers,
  readSessionSnapshot,
  removeSnapshotTempHandler,
  requestSnapshotReset,
  setSnapshotBehavior,
  setSnapshotCustomResponse,
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
  public async describe() { return toInfo(readSessionSnapshot(this.sessionPath)); }
  public async list() { return listSnapshotHandlers(this.sessionPath); }
  public async get(id: string) { return getSnapshotHandler(this.sessionPath, id); }
  public async setBehavior(id: string, behavior: Parameters<typeof setSnapshotBehavior>[2]) {
    const snapshot = setSnapshotBehavior(this.sessionPath, id, behavior);
    await settleAfterWrite();
    const handler = snapshot.state.flattenHandlers.find((entry) => entry.id === id);
    if (!handler) throw new Error(`Handler not found for id: ${id}`);
    return { ...toInfo(snapshot), handler };
  }
  public async setCustomResponse(id: string, response: Parameters<typeof setSnapshotCustomResponse>[2]) {
    const snapshot = setSnapshotCustomResponse(this.sessionPath, id, response);
    await settleAfterWrite();
    const handler = snapshot.state.flattenHandlers.find((entry) => entry.id === id);
    if (!handler) throw new Error(`Handler not found for id: ${id}`);
    return { ...toInfo(snapshot), handler };
  }
  public async addTemp(data: Parameters<typeof addSnapshotTempHandler>[1]) {
    const snapshot = addSnapshotTempHandler(this.sessionPath, data);
    await settleAfterWrite();
    const handler = snapshot.state.flattenHandlers.at(-1);
    if (!handler) throw new Error("Temporary handler was not added");
    return { ...toInfo(snapshot), handler };
  }
  public async removeTemp(id: string) {
    const snapshot = removeSnapshotTempHandler(this.sessionPath, id);
    await settleAfterWrite();
    return toInfo(snapshot);
  }
  public async reset() {
    requestSnapshotReset(this.sessionPath);
    await settleAfterWrite();
    return toInfo(readSessionSnapshot(this.sessionPath));
  }
}
