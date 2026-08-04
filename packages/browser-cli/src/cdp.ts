import WebSocket from "ws";

export type CdpTarget = { id: string; type: string; title: string; url: string; webSocketDebuggerUrl?: string };
export const DEFAULT_CDP_TIMEOUT_MS = 10_000;

export const listTargets = async (
  cdpUrl: string,
  timeoutMs = DEFAULT_CDP_TIMEOUT_MS
): Promise<CdpTarget[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(new URL("/json/list", cdpUrl), { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Timed out while listing Chrome targets after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`Failed to list Chrome targets: ${response.status} ${response.statusText}`);
  return await response.json() as CdpTarget[];
};

export class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  private constructor(private readonly socket: WebSocket) {
    socket.on("message", (raw) => {
      let message: { id?: number; result?: unknown; error?: { message: string } };
      try {
        message = JSON.parse(String(raw)) as typeof message;
      } catch {
        return;
      }
      if (message.id === undefined) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      if (message.error) pending.reject(new Error(`CDP error: ${message.error.message}`));
      else pending.resolve(message.result);
    });
    socket.on("error", (error) => this.rejectAll(error));
    socket.on("close", () => this.rejectAll(new Error("CDP connection closed")));
  }
  public static async connect(url: string, timeoutMs = DEFAULT_CDP_TIMEOUT_MS): Promise<CdpClient> {
    const socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => finish(() => reject(new Error(`Timed out while connecting to Chrome after ${timeoutMs}ms`))), timeoutMs);
      const finish = (callback: () => void) => {
        clearTimeout(timeout);
        socket.off("open", onOpen);
        socket.off("error", onError);
        callback();
      };
      const onOpen = () => finish(resolve);
      const onError = (error: Error) => finish(() => reject(error));
      socket.once("open", onOpen);
      socket.once("error", onError);
    }).catch((error) => {
      socket.terminate();
      throw error;
    });
    return new CdpClient(socket);
  }
  public call(
    method: string,
    params?: Record<string, unknown>,
    timeoutMs = DEFAULT_CDP_TIMEOUT_MS
  ): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for CDP ${method} after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      try {
        this.socket.send(JSON.stringify({ id, method, params }), (error) => {
          if (!error) return;
          const pending = this.pending.get(id);
          if (!pending) return;
          this.pending.delete(id);
          clearTimeout(pending.timeout);
          pending.reject(error);
        });
      } catch (error) {
        this.pending.delete(id);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
  public close() { this.socket.close(); }
  private rejectAll(error: Error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }
}
