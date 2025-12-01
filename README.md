# MSW Dev Tool

A powerful development tool to control mock logic, modify responses, and monitor API calls with [MSW (Mock Service Worker)](https://mswjs.io/).

## 📚 Documentation

For complete documentation, guides, and examples, visit our official documentation site:

**👉 [https://msw-dev-tool-docs.vercel.app/](https://msw-dev-tool-docs.vercel.app/)**

### Quick Links

- [Getting Started](https://msw-dev-tool-docs.vercel.app/docs/get-started) - Installation and setup guide
- [Tools](https://msw-dev-tool-docs.vercel.app/docs/tools) - Overview of available tools
- [Handler Table](https://msw-dev-tool-docs.vercel.app/docs/handler-table) - Manage your handlers
- [Debugger](https://msw-dev-tool-docs.vercel.app/docs/debugger) - Test and debug handlers
- [Custom Trigger](https://msw-dev-tool-docs.vercel.app/docs/custom-trigger) - Customize the UI trigger
- [Playground](https://msw-dev-tool-docs.vercel.app/docs/playground) - Interactive examples
- [Temp Handler](https://msw-dev-tool-docs.vercel.app/docs/temp-handler) - Add temporary handlers
- [Roadmap](https://msw-dev-tool-docs.vercel.app/docs/roadmap) - Future plans and features

## What Problem Does This Solve?

When developing frontend applications with MSW, developers often face the following challenges:

- **Code modification required**: To change mock responses or test different scenarios, you need to modify handler code and restart the development server
- **No runtime control**: There's no way to dynamically control mock behavior during development
- **Limited visibility**: It's difficult to see which handlers are active and monitor API calls in real-time
- **Testing overhead**: Testing different response scenarios requires writing multiple handlers or conditional logic

**MSW Dev Tool** solves these problems by providing a **visual UI** that allows you to:

- Control mock handlers at runtime without code changes
- Modify response behaviors (delay, errors, disable mocks) on the fly
- Monitor all API calls and their handlers
- Test different scenarios instantly during development

## Key Features

### 🎛️ Handler Table

View and manage all your MSW handlers in a comprehensive table interface. Enable, disable, or modify handlers without touching your code.

### 🐛 Debugger

Test and debug your handlers with an interactive debugger. Send requests, inspect responses, and verify handler logic in real-time.

### ⚡ Response Behavior Control

Dynamically control response behaviors:

- **Delay**: Simulate network latency
- **Error**: Trigger error responses
- **Disable Mock**: Bypass specific handlers
- **Custom Logic**: Modify responses on the fly

### 🎨 Customizable UI

Fully customizable trigger UI that can be integrated seamlessly into your application's design.

### 🧪 Temp Handler

Quickly add temporary handlers for testing specific scenarios without modifying your existing handler setup.

### 📊 API Call Monitoring

Monitor all API calls made by your application and see which handlers are intercepting them.

## Installation

### New Package Structure (Recommended)

We recommend using the new modular package structure with `@msw-dev-tool/core` and `@msw-dev-tool/react`:

```bash
# Using pnpm
pnpm add -D @msw-dev-tool/core @msw-dev-tool/react

# Using npm
npm i @msw-dev-tool/core @msw-dev-tool/react --save-dev

# Using yarn
yarn add @msw-dev-tool/core @msw-dev-tool/react --dev
```

### Legacy Package

The `msw-dev-tool` package is now **legacy** and will be deprecated in the future. However, it is still **stable** and fully supported. For new projects, please use the new package structure above.

```bash
# Using pnpm
pnpm add -D msw-dev-tool

# Using npm
npm i msw-dev-tool --save-dev

# Using yarn
yarn add msw-dev-tool --dev
```

For detailed installation and setup instructions, see the [Getting Started Guide](https://msw-dev-tool-docs.vercel.app/docs/get-started).

## Quick Start

### Using New Package Structure

1. **Replace MSW's `setupWorker` with `setupDevToolWorker`:**

```typescript
import { setupDevToolWorker } from "@msw-dev-tool/core";

export const worker = setupDevToolWorker(...handlers);
```

2. **Add the DevTool UI component:**

```tsx
import { MSWDevTool } from "@msw-dev-tool/react";
import "@msw-dev-tool/react/msw-dev-tool.css";

export default function App() {
  return (
    <>
      {/* Your app components */}
      <MSWDevTool />
    </>
  );
}
```

### Using Legacy Package

1. **Replace MSW's `setupWorker` with `setupDevToolWorker`:**

```typescript
import { setupDevToolWorker } from "msw-dev-tool";

export const worker = setupDevToolWorker(...handlers);
```

2. **Add the DevTool UI component:**

```tsx
import { MSWDevTool } from "msw-dev-tool";
import "msw-dev-tool/msw-dev-tool.css";

export default function App() {
  return (
    <>
      {/* Your app components */}
      <MSWDevTool />
    </>
  );
}
```

## Internal Architecture

This project is built on top of two core technologies:

- **[MSW](https://mswjs.io/)**: The foundation for API mocking using Service Workers
- **[Zustand](https://zustand.docs.pmnd.rs/)**: State management for the dev tool UI and handler control

### System Overview

The library consists of two main parts:

1. **Core Logic** (`@msw-dev-tool/core`):
   - Wraps MSW's `setupWorker` with `setupDevToolWorker`
   - Manages handler state and behavior modifications
   - Provides APIs for runtime handler control
   - Uses Zustand for state management

2. **React UI** (`@msw-dev-tool/react`):
   - React components for the dev tool interface
   - Handler table, debugger, and other UI features
   - Communicates with core logic through Zustand store
   - Depends on `@msw-dev-tool/core` as a peer dependency

### How It Works

1. **Worker Integration**: `setupDevToolWorker` wraps MSW's worker and adds additional capabilities for runtime control
2. **State Management**: Zustand store maintains the state of all handlers, their behaviors, and API call history
3. **Runtime Control**: The UI components interact with the Zustand store to modify handler behaviors, which are then applied to the MSW worker
4. **API Monitoring**: Intercepts and logs all API calls made through MSW handlers

## Project Structure

This project uses pnpm workspaces.

| Project          | Description                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **docs**         | The documentation of the library.                                                                                                                                |
| **core**         | `@msw-dev-tool/core`: Core library logic to control MSW handlers                                                                                                 |
| **react**        | `@msw-dev-tool/react`: React UI implementation                                                                                                                   |
| **example**      | A sample project to develop and test `msw-dev-tool`. You need to build `msw-dev-tool` before testing.                                                            |
| **msw-dev-tool** | The **LEGACY** source code of the library. This package will be deprecated in favor of the new modular structure (`@msw-dev-tool/core` + `@msw-dev-tool/react`). |

## Documentation

For complete documentation, visit: [https://msw-dev-tool-docs.vercel.app/](https://msw-dev-tool-docs.vercel.app/)

Key documentation pages:

- [Getting Started](https://msw-dev-tool-docs.vercel.app/docs/get-started)
- [Tools](https://msw-dev-tool-docs.vercel.app/docs/tools)
- [Handler Table](https://msw-dev-tool-docs.vercel.app/docs/handler-table)
- [Debugger](https://msw-dev-tool-docs.vercel.app/docs/debugger)
- [Custom Trigger](https://msw-dev-tool-docs.vercel.app/docs/custom-trigger)
- [Playground](https://msw-dev-tool-docs.vercel.app/docs/playground)
- [Temp Handler](https://msw-dev-tool-docs.vercel.app/docs/temp-handler)
- [Roadmap](https://msw-dev-tool-docs.vercel.app/docs/roadmap)

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
