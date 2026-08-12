# @msw-dev-tool/core

Core logic for msw-dev-tool: handler store, behavior control, and temp handlers.

## Install

```bash
pnpm add -D @msw-dev-tool/core msw
```

## Entries

| Import | Environment |
| --- | --- |
| `@msw-dev-tool/core/browser` | Browser (`setupWorker`) |
| `@msw-dev-tool/core/node` | Node (`setupServer` + session snapshot file) |
| `@msw-dev-tool/core/shared` | Shared core types and schemas |

### Browser

```ts
import { setupDevToolWorker } from "@msw-dev-tool/core/browser";

export const worker = setupDevToolWorker(...handlers);
```

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
