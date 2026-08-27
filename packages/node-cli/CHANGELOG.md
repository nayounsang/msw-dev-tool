# @msw-dev-tool/node-cli

## 0.5.0

### Minor Changes

- 99ff90e: Support independently configured logical message event branches for WebSocket listeners.

### Patch Changes

- Updated dependencies [99ff90e]
  - @msw-dev-tool/core@1.9.0
  - @msw-dev-tool/cli-core@0.4.0

## 0.4.0

### Minor Changes

- f4f152c: Add configurable WebSocket custom responses for sending strings, Blobs, or ArrayBuffers and closing connections with optional code and reason. Expose the configuration through the React WebSocket panel and both browser and Node CLI interfaces.
- e66b95c: Extend temporary WebSocket listeners with independent default and custom responses, delayed/repeated response scheduling, and matching React, snapshot, Node CLI, and Browser CLI controls.
- 70ba84c: Unify temporary and custom response configuration across HTTP and WebSocket APIs, CLIs, persistence, and React controls. HTTP custom responses now support the full temporary response settings, while WebSocket default and custom responses each own their delay and repeat schedule.

### Patch Changes

- Updated dependencies [f4f152c]
- Updated dependencies [e66b95c]
- Updated dependencies [70ba84c]
  - @msw-dev-tool/core@1.8.0
  - @msw-dev-tool/cli-core@0.3.0

## 0.3.1

### Patch Changes

- Updated dependencies [8a4bb4d]
- Updated dependencies [55eb906]
  - @msw-dev-tool/core@1.7.1
  - @msw-dev-tool/cli-core@0.2.6

## 0.3.0

### Minor Changes

- bc2336a: Add WebSocket endpoint and listener management through Node CLI snapshot sessions.

### Patch Changes

- Updated dependencies [78bb3e4]
- Updated dependencies [f87749f]
- Updated dependencies [3618a42]
- Updated dependencies [3ff94dd]
  - @msw-dev-tool/core@1.7.0
  - @msw-dev-tool/cli-core@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [8d996fa]
  - @msw-dev-tool/core@1.6.0
  - @msw-dev-tool/cli-core@0.2.4

## 0.2.3

### Patch Changes

- bda8f30: Store Node sessions in cwd-scoped PID snapshot files and add PID-based CLI selection.
- Updated dependencies [67de2dd]
- Updated dependencies [bda8f30]
  - @msw-dev-tool/core@1.5.1
  - @msw-dev-tool/cli-core@0.2.3

## 0.2.2

### Patch Changes

- Updated dependencies [a9f235c]
  - @msw-dev-tool/core@1.5.0
  - @msw-dev-tool/cli-core@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [5b505c2]
  - @msw-dev-tool/core@1.4.0
  - @msw-dev-tool/cli-core@0.2.1

## 0.2.0

### Minor Changes

- a0a8afd: Add CLI commands for storing handler custom response configuration in Node and browser sessions.

### Patch Changes

- Updated dependencies [a0a8afd]
- Updated dependencies [ba63316]
- Updated dependencies [0c6efc4]
  - @msw-dev-tool/cli-core@0.2.0
  - @msw-dev-tool/core@1.3.0

## 0.1.2

### Patch Changes

- a00bfd7: Add the browser control CLI and its versioned browser-control protocol.
- Updated dependencies [a00bfd7]
  - @msw-dev-tool/cli-core@0.1.1
  - @msw-dev-tool/core@1.2.1

## 0.1.1

### Patch Changes

- Updated dependencies [5f6fc3c]
  - @msw-dev-tool/core@1.2.0
