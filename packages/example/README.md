# example (Next.js SSR)

Browser + Node MSW in one app.

- **Client mocking** — button `fetch`, `setupDevToolWorker`, `MSWDevTool`
- **SSR mocking** — RSC `fetch` with `{ cache: "no-store" }`, `setupDevToolServer` via `instrumentation.ts`

## Run

```bash
# from repo root (build core/react/cli first if needed)
yarn build:core && yarn build:react && yarn build:node-cli
yarn workspace example dev
```

Open http://127.0.0.1:3001

## CLI (Node session)

From `packages/example` (so `.msw-dev-tool/session` resolves):

```bash
yarn msw-dev-tool list
yarn msw-dev-tool set-behavior '{"path":"https://ssr.example.local/users","method":"get"}' delay
```

Then refresh the page — only the SSR slot should reflect Node-side behavior (error slot is isolated via `@ssr/error.tsx`).
