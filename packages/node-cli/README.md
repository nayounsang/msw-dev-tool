# @msw-dev-tool/node-cli

CLI for **AI agents** to programmatically control [msw-dev-tool](https://github.com/nayounsang/msw-dev-tool) in Node.js.

> This package is **not** a human-oriented interactive TUI. It is designed for machine-readable, one-shot commands that AI agents (and scripts) can call.

## How it works

1. Your app calls `setupDevToolServer()` from `@msw-dev-tool/core/node`.
2. That process owns `SetupServer` and writes a **session snapshot** file (like browser `sessionStorage`).
3. This CLI reads/writes that snapshot. The owner process polls and applies changes to MSW.

The CLI never mutates another process's in-memory store directly.

## Install

```bash
pnpm add -D @msw-dev-tool/node-cli @msw-dev-tool/core msw
```

## Session discovery

Sessions are PID-named files in `.msw-dev-tool/sessions` under the current
working directory. Run `msw-dev-tool sessions` to list them. Commands select a
session automatically only when exactly one exists; when there are multiple,
pass `--pid <pid>`. The former `--session` option and `MSW_DEV_TOOL_SESSION`
environment variable are not supported.

## Commands

All commands print JSON to stdout.

```bash
msw-dev-tool sessions
msw-dev-tool --pid 4182 list
msw-dev-tool session
msw-dev-tool list
msw-dev-tool get '<id>'
msw-dev-tool set-behavior '<id>' delay
msw-dev-tool add-temp --json '{"path":"/api/tmp","method":"get","contentType":"application/json","status":"200","response":"{\"ok\":true}"}'
msw-dev-tool remove-temp '<id>'
msw-dev-tool reset
```

## Example (app)

```ts
import { setupDevToolServer } from "@msw-dev-tool/core/node";
import { handlers } from "./handlers";

const server = await setupDevToolServer(...handlers);
server.listen();
```

Then from another process / AI agent:

```bash
msw-dev-tool --pid 4182 list
msw-dev-tool --pid 4182 set-behavior '{"path":"/api/user","method":"get"}' "network error"
```

After changing handler code, run `msw-dev-tool reset` and wait for `ok` before further commands. Writes during an in-flight reset can be discarded when the owner reseeds; the CLI settles ~300ms so `ok` usually means apply finished.
