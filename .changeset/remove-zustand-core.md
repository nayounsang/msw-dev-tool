---
"@msw-dev-tool/core": minor
---

Remove the `zustand` dependency. Handler state now uses a lightweight store with React `useSyncExternalStore`, so consumers no longer need to install or configure zustand.
