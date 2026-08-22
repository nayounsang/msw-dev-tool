# MSW Dev Tool

Inspect and control HTTP and WebSocket mock scenarios at runtime with MSW Dev Tool.

MSW Dev Tool connects to MSW handlers that define your API contracts and normal scenarios. Use the browser UI to inspect requests and responses, switch a handler's runtime behavior, disable a mock to exercise the real API, or create a temporary mock API without adding exploratory handler code. CLI control is also available when automation is useful.

## Documentation

- [Getting Started](https://msw-dev-tool-docs.vercel.app/docs/get-started)
- [How to Use](https://msw-dev-tool-docs.vercel.app/docs/how-to-use)
- [HTTP Mocking Scenarios](https://msw-dev-tool-docs.vercel.app/docs/http)
- [WebSocket Mocking Scenarios](https://msw-dev-tool-docs.vercel.app/docs/websocket)
- [Node CLI](https://msw-dev-tool-docs.vercel.app/docs/node-cli)
- [Browser CLI](https://msw-dev-tool-docs.vercel.app/docs/browser-cli)

## Install

For a browser UI, install the modular packages:

```bash
pnpm add -D @msw-dev-tool/core @msw-dev-tool/react msw
```

```ts
import { setupDevToolWorker } from "@msw-dev-tool/core/browser";

export const worker = setupDevToolWorker(...handlers);
```

```tsx
import { MSWDevTool } from "@msw-dev-tool/react";
import "@msw-dev-tool/react/msw-dev-tool.css";

export function App() {
  return <MSWDevTool />;
}
```

For Node MSW sessions, use `setupDevToolServer` from `@msw-dev-tool/core/node` and control it with `@msw-dev-tool/node-cli`.

## Packages

| Package | Purpose |
| --- | --- |
| `@msw-dev-tool/core` | Runtime integration for browser and Node MSW handlers |
| `@msw-dev-tool/react` | Browser UI for HTTP and WebSocket scenario control |
| `@msw-dev-tool/node-cli` | Machine-readable control for Node sessions |
| `@msw-dev-tool/browser-cli` | Machine-readable CDP control for browser sessions |

## License

MIT
