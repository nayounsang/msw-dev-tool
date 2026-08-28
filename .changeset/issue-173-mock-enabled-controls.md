---
"@msw-dev-tool/core": minor
"@msw-dev-tool/react": minor
"@msw-dev-tool/cli-core": minor
"@msw-dev-tool/browser-cli": minor
"@msw-dev-tool/node-cli": minor
---

Add global and per-HTTP-handler mock enable controls that preserve response behavior and persisted state. The React UI now exposes these controls, and the Browser and Node CLIs support `set-enabled` and `set-mock-enabled` commands alongside existing WebSocket-specific enable controls.
