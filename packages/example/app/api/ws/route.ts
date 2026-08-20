import { ensureMswServer } from "@/mocks/node";

export const runtime = "nodejs";

const APPROVED_SOCKET_TARGET = "ws://node.example.local/chat";

const waitForSocketResult = (target: string, message: string) => new Promise<
  { type: "message"; data: string } | { type: "close"; code: number; reason: string }
>((resolve, reject) => {
  const socket = new WebSocket(target);
  const timer = setTimeout(() => {
    socket.close();
    reject(new Error("WebSocket mock did not respond"));
  }, 2_000);
  socket.addEventListener("open", () => socket.send(message), { once: true });
  socket.addEventListener("message", (event) => {
    clearTimeout(timer);
    socket.close();
    resolve({ type: "message", data: String(event.data) });
  }, { once: true });
  socket.addEventListener("close", (event) => {
    clearTimeout(timer);
    resolve({ type: "close", code: event.code, reason: event.reason });
  }, { once: true });
  socket.addEventListener("error", () => {
    clearTimeout(timer);
    reject(new Error("WebSocket mock connection failed"));
  }, { once: true });
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("target") ?? APPROVED_SOCKET_TARGET;
  if (target !== APPROVED_SOCKET_TARGET) {
    return Response.json({ error: "Unsupported WebSocket target" }, { status: 400 });
  }

  await ensureMswServer();
  const message = url.searchParams.get("message") ?? "hello";
  return Response.json(await waitForSocketResult(target, message));
}
