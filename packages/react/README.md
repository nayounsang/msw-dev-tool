# @msw-dev-tool/react

React UI for runtime HTTP and WebSocket mock scenario control.

## Install

```bash
pnpm add -D @msw-dev-tool/core @msw-dev-tool/react msw
```

## Use

```tsx
import { MSWDevTool } from "@msw-dev-tool/react";
import "@msw-dev-tool/react/msw-dev-tool.css";

export function App() {
  return <MSWDevTool />;
}
```

Configure the worker with `setupDevToolWorker(...handlers)` from `@msw-dev-tool/core/browser`. The UI lets you inspect HTTP scenarios and WebSocket endpoints/listeners, then change their enabled state or response behavior at runtime.

See [Getting Started](https://msw-dev-tool-docs.vercel.app/docs/get-started), [HTTP Mocking Scenarios](https://msw-dev-tool-docs.vercel.app/docs/http), and [WebSocket Mocking Scenarios](https://msw-dev-tool-docs.vercel.app/docs/websocket).
