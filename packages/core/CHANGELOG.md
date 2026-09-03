# @msw-dev-tool/core

## 1.10.0

### Minor Changes

- ae9a86a: Add global and per-HTTP-handler mock enable controls that preserve response behavior and persisted state. The React UI now exposes these controls, and the Browser and Node CLIs support `set-enabled` and `set-mock-enabled` commands alongside existing WebSocket-specific enable controls.

## 1.9.0

### Minor Changes

- 99ff90e: Support independently configured logical message event branches for WebSocket listeners.

## 1.8.0

### Minor Changes

- f4f152c: Add configurable WebSocket custom responses for sending strings, Blobs, or ArrayBuffers and closing connections with optional code and reason. Expose the configuration through the React WebSocket panel and both browser and Node CLI interfaces.
- e66b95c: Extend temporary WebSocket listeners with independent default and custom responses, delayed/repeated response scheduling, and matching React, snapshot, Node CLI, and Browser CLI controls.
- 70ba84c: Unify temporary and custom response configuration across HTTP and WebSocket APIs, CLIs, persistence, and React controls. HTTP custom responses now support the full temporary response settings, while WebSocket default and custom responses each own their delay and repeat schedule.

## 1.7.1

### Patch Changes

- 8a4bb4d: Add WebSocket endpoint and message-listener controls to the React dev tool. Temporary WebSocket listeners now require a send or close default action.
- 55eb906: Add configurable WebSocket response presets and listener controls.

## 1.7.0

### Minor Changes

- 78bb3e4: Add WebSocket endpoint and listener management through Browser CLI CDP sessions.
- 3618a42: Add unified WebSocket endpoint and listener state management, lifecycle controls, and Browser/Node session persistence.
- 3ff94dd: Add the environment-neutral `@msw-dev-tool/core/msw` WebSocket wrapper and in-memory discovery of code-defined WebSocket endpoints and message listeners.

### Patch Changes

- f87749f: Apply WebSocket endpoint and listener state changes to browser and Node runtimes, including temporary handler lifecycle and message behavior controls.

## 1.6.0

### Minor Changes

- 8d996fa: Replace the global browser control protocol gate with method-level capability checks while preserving compatibility metadata for older CLI versions.

## 1.5.1

### Patch Changes

- 67de2dd: Fix custom HTTP 305 responses to use the standard `Use Proxy` status text.
- bda8f30: Store Node sessions in cwd-scoped PID snapshot files and add PID-based CLI selection.

## 1.5.0

### Minor Changes

- a9f235c: Export standard HTTP status messages and use them consistently for custom responses and status-code behaviors.

## 1.4.0

### Minor Changes

- 5b505c2: Require consumers to import browser, Node, and shared APIs from their dedicated `@msw-dev-tool/core` subpath entrypoints.

## 1.3.0

### Minor Changes

- a0a8afd: Add CLI commands for storing handler custom response configuration in Node and browser sessions.
- ba63316: Add handler-level custom response behavior with configurable body, headers, and status.

### Patch Changes

- 0c6efc4: Preserve network error responses when wrapping request handlers.

## 1.2.1

### Patch Changes

- a00bfd7: Add the browser control CLI and its versioned browser-control protocol.

## 1.2.0

### Minor Changes

- 5f6fc3c: Add Node MSW session support for controlling mock handlers from external tools.

## 1.1.0

### Minor Changes

- 9c702e0: Remove the `zustand` dependency. Handler state now uses a lightweight store with React `useSyncExternalStore`, so consumers no longer need to install or configure zustand.

## 1.0.5

### Patch Changes

- 53af3bf: `useHandlerStore`: React state management api, use store in vanilla js & react correctly. To implement this, add optional peer dep: `react`.

## 1.0.4

### Patch Changes

- 7ea2769: Remove the temp handler
- dbc7c01: Update readme

## 1.0.3

### Patch Changes

- 9e75cfd: Move `zustand` from `peer dep` to `dep`. No need to put this as peer dep

## 1.0.2

### Patch Changes

- 40bc24c: - export setupDevtoolWorker

## 1.0.1

### Patch Changes

- 99ddc24: - Change build script and add info in package.json

## 1.0.0

### Major Changes

- 6510e36: - Separate core logic of `msw-dev-tool`.
  - It is not used internally by `msw-dev-tool` yet.
  - This package includes type, core logic and schema.
  - Same as `msw-dev-tool/src/lib/**`, but files are split.
  - It is test publish.
