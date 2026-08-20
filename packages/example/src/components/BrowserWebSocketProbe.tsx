"use client";

import { useState } from "react";

const ENDPOINT = "ws://browser.example.local/cli-e2e";

type Result = "idle" | "connecting" | `message: ${string}` | `close: ${number} ${string}` | "timeout" | "error";

export const BrowserWebSocketProbe = () => {
  const [result, setResult] = useState<Result>("idle");

  const connect = () => {
    setResult("connecting");
    const socket = new WebSocket(ENDPOINT);
    let finished = false;
    const timer = window.setTimeout(() => {
      finish("timeout");
      socket.close();
    }, 2_000);
    const finish = (next: Result) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      setResult(next);
    };
    socket.addEventListener("open", () => socket.send("ping"), { once: true });
    socket.addEventListener("message", (event) => {
      socket.close();
      finish(`message: ${String(event.data)}`);
    }, { once: true });
    socket.addEventListener("close", (event) => finish(`close: ${event.code} ${event.reason}`), { once: true });
    socket.addEventListener("error", () => finish("error"), { once: true });
  };

  return (
    <section>
      <h3>Browser WebSocket CLI probe</h3>
      <p>Endpoint: <code>{ENDPOINT}</code></p>
      <button type="button" onClick={connect}>Connect WebSocket</button>
      <output aria-live="polite">{result}</output>
    </section>
  );
};
