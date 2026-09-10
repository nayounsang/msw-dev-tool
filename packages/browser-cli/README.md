# @msw-dev-tool/browser-cli

Machine-readable CLI for AI agents and scripts to control a browser MSW Dev Tool session through Chrome DevTools Protocol.

Start a separate Chrome profile with `--remote-debugging-port=9222` and a non-default `--user-data-dir`, then choose the page target that runs `setupDevToolWorker(...handlers)`:

```bash
msw-dev-tool-browser tabs --cdp-url http://127.0.0.1:9222
target_id="paste-the-target-id-from-tabs"
cdp_args=(--cdp-url http://127.0.0.1:9222 --target "$target_id")
msw-dev-tool-browser set-mock-enabled false "${cdp_args[@]}"
msw-dev-tool-browser set-enabled '<handler-id>' false "${cdp_args[@]}"
msw-dev-tool-browser ws-list "${cdp_args[@]}"
endpoint_id="$(msw-dev-tool-browser ws-add-endpoint --json '{"kind":"string","value":"ws://localhost:8080/preview"}' "${cdp_args[@]}" | jq -r '.endpoint.endpointId')"
listener_id="$(msw-dev-tool-browser ws-add-listener "$endpoint_id" --json '{"behavior":{"preset":"default"},"response":{"type":"send","dataType":"string","value":"temp response","delay":300,"repeat":{"interval":500,"repetitions":3}},"customResponse":{"type":"send","dataType":"string","value":"custom response","delay":100}}' "${cdp_args[@]}" | jq -r '.listener.info.id')"
msw-dev-tool-browser ws-set-listener-response "$listener_id" --json '{"type":"send","dataType":"string","value":"scheduled","delay":300,"repeat":{"interval":500,"repetitions":"Infinity"}}' "${cdp_args[@]}"
msw-dev-tool-browser ws-set-listener-response "$listener_id" --json '{"type":"send","dataType":"string","value":"updated temp response"}' "${cdp_args[@]}"
msw-dev-tool-browser ws-set-listener-custom-response "$listener_id" --json '{"type":"send","dataType":"Blob","value":"68 69","metadata":{"type":"text/plain"}}' "${cdp_args[@]}"
msw-dev-tool-browser ws-set-listener-behavior "$listener_id" --json '{"preset":"custom response"}' "${cdp_args[@]}"
msw-dev-tool-browser ws-set-listener-event-behavior "$listener_id" 'chat/join' --json '{"preset":"send","options":{"message":"joined"}}' "${cdp_args[@]}"
msw-dev-tool-browser reset "${cdp_args[@]}"
```

Successful commands write JSON to stdout. Errors are plain text on stderr and exit non-zero. The CLI supports HTTP scenarios and WebSocket endpoint/listener commands. `set-enabled <handlerId> <true|false>` controls one HTTP handler; `set-mock-enabled <true|false>` is the global HTTP and WebSocket switch. Its result includes `mockEnabled`, and it preserves individual settings while disabled. WebSocket `ws-set-*-enabled` commands control only their endpoint, listener, or logical event branch. Temporary listeners default to `{"preset":"default"}`; `response` and `customResponse` are independent, and the selected Behavior chooses which one is used. Delay defaults to `0`, repetitions include the first response, and unbounded repetition is the JSON string `"Infinity"`. Infinite repetition requires a positive interval and a local test client; stop it by updating or removing the listener, closing the client, or resetting the Dev Tool. The `ws-set-listener-response` command replaces the complete response configuration, including its delay and repetition settings. Custom WebSocket responses use `type: "send"` or `type: "close"`. Send responses require `dataType: "string"`, `"Blob"`, or `"ArrayBuffer"` and a `value`; Blob and ArrayBuffer values are space-separated hexadecimal bytes. Close responses accept optional `code` and `reason`, and send responses may include optional Blob metadata. After testing, reset the selected target and close the dedicated Chrome profile. See the [Browser CLI documentation](https://msw-dev-tool-docs.vercel.app/docs/browser-cli) for configuration, every command, and CDP target selection.
