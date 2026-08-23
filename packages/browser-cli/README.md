# @msw-dev-tool/browser-cli

Machine-readable CLI for AI agents and scripts to control a browser MSW Dev Tool session through Chrome DevTools Protocol.

Start Chrome with `--remote-debugging-port=9222` and a non-default `--user-data-dir`, then choose the tab that runs `setupDevToolWorker()`:

```bash
msw-dev-tool-browser tabs --cdp-url http://127.0.0.1:9222
msw-dev-tool-browser ws-list --cdp-url http://127.0.0.1:9222 --target <target-id>
msw-dev-tool-browser ws-set-listener-behavior '<listener-id>' --json '{"preset":"send","options":{"message":"hello"}}' --cdp-url http://127.0.0.1:9222 --target <target-id>
msw-dev-tool-browser ws-set-listener-custom-response '<listener-id>' --json '{"type":"send","dataType":"Blob","value":"68 69","metadata":{"type":"text/plain"}}' --cdp-url http://127.0.0.1:9222 --target <target-id>
msw-dev-tool-browser ws-set-listener-behavior '<listener-id>' --json '{"preset":"custom response"}' --cdp-url http://127.0.0.1:9222 --target <target-id>
```

The CLI supports HTTP scenarios and WebSocket endpoint/listener commands with JSON output. Save a custom WebSocket response first, then select the `custom response` behavior to apply it. Custom WebSocket responses use `type: "send"` or `type: "close"`. Send responses require `dataType: "string"`, `"Blob"`, or `"ArrayBuffer"` and a `value`; Blob and ArrayBuffer values are space-separated hexadecimal bytes. Close responses accept optional `code` and `reason`, and send responses may include optional Blob metadata. See the [Browser CLI documentation](https://msw-dev-tool-docs.vercel.app/docs/browser-cli) for configuration, every command, and CDP target selection.
