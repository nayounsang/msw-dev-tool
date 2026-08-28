# @msw-dev-tool/core

Core runtime integration for HTTP and WebSocket scenario control.

HTTP handlers and WebSocket endpoints, listeners, and logical event branches each have their own
enable setting. The shared global `mockEnabled` switch takes precedence over all of them: when it
is off, HTTP and WebSocket traffic passes through while individual response settings are retained.

## Install

```bash
pnpm add -D @msw-dev-tool/core msw
```

## Entries

| Import                       | Environment                                  |
| ---------------------------- | -------------------------------------------- |
| `@msw-dev-tool/core/browser` | Browser (`setupWorker`)                      |
| `@msw-dev-tool/core/node`    | Node (`setupServer` + session snapshot file) |
| `@msw-dev-tool/core/shared`  | Shared core types and schemas                |

### Browser

```ts
import { setupDevToolWorker } from "@msw-dev-tool/core/browser";

export const worker = setupDevToolWorker(...handlers);
```

### WebSocket handlers

Import `ws` from `@msw-dev-tool/core/msw` to make code-defined WebSocket endpoints and `message` listeners available to MSW Dev Tool.

A message listener can optionally declare logical payload events. Each declared event gets an independent behavior and response configuration; unknown event types and resolver errors run the original listener.

```ts
client.addEventListener("message", onMessage, {
  mswDevTool: {
    eventTypes: ["chat/join", "chat/message"],
    resolveEventType: (data: string) => JSON.parse(data).type,
  },
});
```

```ts
import { ws } from "@msw-dev-tool/core/msw";

export const handlers = [
  ws.link("ws://localhost:8080/chat").addEventListener("connection", ({ client }) => {
    client.addEventListener("message", (event) => client.send(`received: ${event.data}`));
  }),
];
```

See [WebSocket Mocking Scenarios](https://msw-dev-tool-docs.vercel.app/docs/websocket) for runtime behaviors and temporary endpoints.

### Node

```ts
import { setupDevToolServer } from "@msw-dev-tool/core/node";

const server = await setupDevToolServer(...handlers);
server.listen();
```

Node sessions persist handler state to `.msw-dev-tool/sessions/<pid>.json` in the
directory from which the server starts. The snapshot uses the same `{ revision,
state }` envelope as browser storage and records the owning process PID.

Multiple Node processes started from the same directory each receive their own
PID-named session file. A normal `dispose()` or process exit removes only that
process's snapshot and lock. Crash leftovers are intentionally retained so they
can be inspected or removed manually; starting a process that reuses that PID
replaces its old artifacts. AI agents can control a session with
[`@msw-dev-tool/node-cli`](../node-cli).
