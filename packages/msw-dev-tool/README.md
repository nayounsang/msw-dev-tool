# Install

- npm:
```bash
npm i msw-dev-tool --save-dev
```

- yarn:
```bash
yarn add msw-dev-tool --dev
```

- pnpm:
```bash
pnpm add msw-dev-tool --save-dev
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
- [install msw](https://mswjs.io/docs/getting-started)
- [install zustand](https://zustand.docs.pmnd.rs/getting-started/introduction#installation)

# Usage
> Please look forward to the official document. I will tell you how to use it in more detail.

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
import { setupDevToolWorker } from "msw-dev-tool";

// use setupDevToolWorker instead of setupWorker from msw.
export const worker = setupDevToolWorker(...handlers);

```


# ProjectStructure

This project uses pnpm workspaces.

| Project          | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **example**      | A sample project to develop and test `msw-dev-tool`. You need to build `msw-dev-tool` before testing. |
| **msw-dev-tool** | The source code of the library.                                                                       |