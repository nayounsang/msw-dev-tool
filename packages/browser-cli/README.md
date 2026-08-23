# @msw-dev-tool/browser-cli

Machine-readable CLI for AI agents and scripts to control a browser MSW Dev Tool session through Chrome DevTools Protocol.

Start Chrome with `--remote-debugging-port=9222` and a non-default `--user-data-dir`, then choose the tab that runs `setupDevToolWorker()`:

```bash
msw-dev-tool-browser tabs --cdp-url http://127.0.0.1:9222
msw-dev-tool-browser ws-list --cdp-url http://127.0.0.1:9222 --target <target-id>
msw-dev-tool-browser ws-add-listener '<endpoint-id>' --json '{"behavior":{"preset":"default"},"response":{"type":"send","dataType":"string","value":"temp response"},"customResponse":{"type":"send","dataType":"string","value":"custom response"},"delay":300,"repeat":{"interval":500,"repetitions":3}}' --cdp-url http://127.0.0.1:9222 --target <target-id>
msw-dev-tool-browser ws-set-listener-schedule '<listener-id>' --json '{"delay":300,"repeat":{"interval":500,"repetitions":"Infinity"}}' --cdp-url http://127.0.0.1:9222 --target <target-id>
msw-dev-tool-browser ws-set-listener-custom-response '<listener-id>' --json '{"type":"send","dataType":"Blob","value":"68 69","metadata":{"type":"text/plain"}}' --cdp-url http://127.0.0.1:9222 --target <target-id>
msw-dev-tool-browser ws-set-listener-behavior '<listener-id>' --json '{"preset":"custom response"}' --cdp-url http://127.0.0.1:9222 --target <target-id>
```

The CLI supports HTTP scenarios and WebSocket endpoint/listener commands with JSON output. Temporary listeners default to `{"preset":"default"}`; `response` and `customResponse` are independent, and the selected Behavior chooses which one is used. Delay defaults to `0`, repetitions include the first response, and unbounded repetition is the JSON string `"Infinity"`. Use the response and schedule mutation commands to update them independently. Custom WebSocket responses use `type: "send"` or `type: "close"`. Send responses require `dataType: "string"`, `"Blob"`, or `"ArrayBuffer"` and a `value`; Blob and ArrayBuffer values are space-separated hexadecimal bytes. Close responses accept optional `code` and `reason`, and send responses may include optional Blob metadata. See the [Browser CLI documentation](https://msw-dev-tool-docs.vercel.app/docs/browser-cli) for configuration, every command, and CDP target selection.
