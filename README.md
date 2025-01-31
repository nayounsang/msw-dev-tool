# Install

```bash
npm i msw-dev-tool --save-dev
```

## Peer Dep

These dependencies are assumed to already exist in your project.
If not, please install it.

```json
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "zustand": "^5.0.2",
    "msw": "^2.7.0"
```

# Usage

## UI

```jsx
import { MSWDevTool } from "msw-dev-tool";
import "msw-dev-tool/msw-dev-tool.css"

function App() {

  return (
    <>
      <MSWDevTool />
      {/* ... */}
    </>
  );
}
```

## Integration with msw

```typescript
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { initMSWDevTool } from "msw-dev-tool";

// Wrap worker init logic with `initMSWDevTool` middleware.
export const worker = initMSWDevTool(setupWorker(...handlers));

```

# Structure

This project uses pnpm workspaces.

| Project          | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **example**      | A sample project to develop and test `msw-dev-tool`. You need to build `msw-dev-tool` before testing. |
| **msw-dev-tool** | The source code of the library.                                                                       |