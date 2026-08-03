# @msw-dev-tool/core

Core logic for msw-dev-tool: handler store, behavior control, and temp handlers.

## Install

```bash
pnpm add -D @msw-dev-tool/core msw
```

## Entries

| Import | Environment |
| --- | --- |
| `@msw-dev-tool/core` / `@msw-dev-tool/core/browser` | Browser (`setupWorker`) |
| `@msw-dev-tool/core/node` | Node (`setupServer` + session snapshot file) |

### Browser

```ts
import { setupDevToolWorker } from "@msw-dev-tool/core";

export const worker = setupDevToolWorker(...handlers);
```

### Node

```ts
import { setupDevToolServer } from "@msw-dev-tool/core/node";

const server = await setupDevToolServer(...handlers);
server.listen();
```

Node sessions persist handler state to a temp **snapshot file** (same mental model as browser `sessionStorage`). AI agents can control the session with [`@msw-dev-tool/node-cli`](../node-cli).
