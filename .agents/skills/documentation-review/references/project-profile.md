# MSW Dev Tool project profile

This profile keeps recurring repository facts in one place. Re-check implementation details when the branch changes; this is a routing aid, not a substitute for source verification.

## Documentation inventory and canonical relationships

- Root overview: `README.md` (package overview and links to the deployed docs).
- Published package contracts: `packages/*/README.md`, especially `packages/core/README.md`, `packages/react/README.md`, `packages/node-cli/README.md`, and `packages/browser-cli/README.md`.
- Canonical site source: `packages/docs/app/docs/**/page.mdx`.
- Site navigation and visibility: `packages/docs/app/docs/_meta.tsx`. `handler-table`, `debugger`, `tools`, and `temp-handler` are hidden pages; do not assume hidden means deleted. Check links and the page source before calling one orphaned or obsolete.
- Site project scaffold: `packages/docs/README.md`. Treat the default create-next-app text as unrelated scaffold unless the task explicitly concerns developing the docs app.
- Generated/derived content: `packages/docs/.next/**` and `packages/docs/public/_pagefind/**`; use them as build evidence only and never recommend editing them.
- Repository browser workflow: `AGENTS.md`; it defines the separate Chrome profile, CDP port, target-ID distinction, mutation tool, verification tool, and reset command.

When a page and a README repeat a command or schema, compare both to the implementation and recommend a canonical location rather than accepting either copy by default.

## Package and API truth sources

- `packages/core/package.json` exports `@msw-dev-tool/core/browser`, `/node`, `/shared`, and `/msw`; inspect these exports and the corresponding `packages/core/src/**/index.ts` files before accepting an import.
- `packages/core/src/browser/index.ts` and `packages/core/src/node/index.ts` define browser/node setup entry points. Check whether setup returns a promise and what lifecycle/cleanup it exposes.
- `packages/core/src/msw/**` and `packages/core/src/shared/**` define WebSocket handlers, behavior, response schemas, IDs, defaults, and validation.
- `packages/react/package.json` exports the React entry point and `./msw-dev-tool.css`; inspect `packages/react/src/**` for visible labels and supported UI operations.
- `packages/cli-core/src/commands.ts`, `args.ts`, `types.ts`, and `output.ts` are the shared CLI contract: command names, usage, positionals, flags, JSON parsing, and output shape.
- `packages/node-cli/src/**` and `packages/node-cli/bin/msw-dev-tool.js` define the Node executable and session selection. `packages/browser-cli/src/**` and `packages/browser-cli/bin/msw-dev-tool-browser.js` define the CDP executable, required flags, target selection, and browser behavior.
- Focused tests in the same package are strong evidence for edge cases and output contracts; use tests after the implementation and schemas, not instead of them.

## Verification commands

Use only commands relevant to the reviewed claim and record the exact command/result:

```bash
yarn workspace docs build
yarn workspace @msw-dev-tool/core typecheck
yarn workspace @msw-dev-tool/cli-core typecheck
yarn workspace @msw-dev-tool/node-cli typecheck
yarn workspace @msw-dev-tool/browser-cli typecheck
yarn workspace @msw-dev-tool/core test --run
yarn workspace @msw-dev-tool/node-cli test --run
yarn workspace @msw-dev-tool/browser-cli test --run
```

The docs build may regenerate ignored or derived files; do not edit or commit those outputs during a review. If a command is unavailable or expensive, report it as not run instead of inferring success.

## Browser runtime checks

Only perform a live browser check when the request requires runtime evidence and the user has supplied or authorized the environment. Follow `AGENTS.md` exactly: start the separate profile on `http://127.0.0.1:9222`, confirm the tab calls `setupDevToolWorker(...handlers)`, obtain the Browser CLI target ID with `msw-dev-tool-browser tabs`, use Browser CLI for mutations, inspect the same tab with Chrome DevTools MCP, and reset the target after the scenario. Do not substitute a Chrome DevTools page ID for the Browser CLI target ID.
