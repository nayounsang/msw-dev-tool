"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { getPlaygroundWebSocketUrl } from "@/mock/websocket";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
type MessageType = "echo" | "uppercase" | "ping";
type LogEntry = {
  id: number;
  direction: "sent" | "received" | "error";
  message: string;
  time: string;
};

const statusLabels: Record<ConnectionStatus, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting…",
  connected: "Connected",
  error: "Connection error",
};

export const WebSocketDemo = () => {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messageType, setMessageType] = useState<MessageType>("echo");
  const [message, setMessage] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const nextLogId = useRef(0);

  const addLogEntry = (direction: LogEntry["direction"], content: string) => {
    setLog((entries) => [
      ...entries,
      {
        id: nextLogId.current++,
        direction,
        message: content,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
        socketRef.current = null;
      }
    };
  }, []);

  const connect = () => {
    if (socketRef.current) return;

    setStatus("connecting");
    const socket = new WebSocket(getPlaygroundWebSocketUrl());
    socketRef.current = socket;
    let hadError = false;

    socket.onopen = () => setStatus("connected");
    socket.onmessage = (event) => addLogEntry("received", String(event.data));
    socket.onerror = () => {
      hadError = true;
      setStatus("error");
      addLogEntry("error", "WebSocket connection error");
    };
    socket.onclose = () => {
      if (socketRef.current !== socket) return;

      socketRef.current = null;
      setStatus(hadError ? "error" : "disconnected");
    };
  };

  const disconnect = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socketRef.current = null;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.close();
    setStatus("disconnected");
  };

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const payload = messageType === "ping" ? { type: messageType } : { type: messageType, message };
    const serialized = JSON.stringify(payload);
    socket.send(serialized);
    addLogEntry("sent", serialized);
    setMessage("");
  };

  const isConnected = status === "connected";
  const canConnect = status === "disconnected" || status === "error";
  const canDisconnect = status === "connecting" || isConnected;

  return (
    <section className="my-8 rounded-xl border border-neutral-700 bg-neutral-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">WebSocket demo</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Send a message and inspect its response in the log or WebSocket panel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-medium ${
              status === "connected"
                ? "text-emerald-400"
                : status === "error"
                  ? "text-red-400"
                  : "text-neutral-400"
            }`}
            role="status"
          >
            {statusLabels[status]}
          </span>
          {canConnect ? (
            <button
              type="button"
              onClick={connect}
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-500"
            >
              Connect
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnect}
              disabled={!canDisconnect}
              className="rounded-md border border-neutral-600 px-3 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <form onSubmit={sendMessage} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="playground-message-type">
          Message type
        </label>
        <select
          id="playground-message-type"
          value={messageType}
          onChange={(event) => setMessageType(event.target.value as MessageType)}
          disabled={!isConnected}
          className="rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 disabled:opacity-50"
        >
          <option value="echo">Echo</option>
          <option value="uppercase">Uppercase</option>
          <option value="ping">Ping</option>
        </select>
        <label className="sr-only" htmlFor="playground-message">
          Message
        </label>
        <input
          id="playground-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={messageType === "ping" ? "Ping has no message body" : "Type a message"}
          disabled={!isConnected || messageType === "ping"}
          className="min-w-0 flex-1 rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isConnected || (messageType !== "ping" && !message.trim())}
          className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <div className="mt-5" aria-live="polite">
        <h4 className="mb-2 text-sm font-semibold text-neutral-300">Message log</h4>
        {log.length === 0 ? (
          <p className="rounded-md bg-neutral-950 px-3 py-4 text-sm text-neutral-500">
            Messages will appear here.
          </p>
        ) : (
          <ol className="max-h-72 space-y-2 overflow-y-auto rounded-md bg-neutral-950 p-3">
            {log.map((entry) => (
              <li key={entry.id} className="flex gap-3 text-sm">
                <time className="shrink-0 font-mono text-xs text-neutral-500">{entry.time}</time>
                <span
                  className={`shrink-0 font-medium ${
                    entry.direction === "sent"
                      ? "text-cyan-400"
                      : entry.direction === "received"
                        ? "text-emerald-400"
                        : "text-red-400"
                  }`}
                >
                  {entry.direction === "sent"
                    ? "Sent"
                    : entry.direction === "received"
                      ? "Received"
                      : "Error"}
                </span>
                <code className="min-w-0 break-all text-neutral-200">{entry.message}</code>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
};
