# Agent instructions

## Browser MCP workflow

When working with the browser version of MSW Dev Tool, use the project-local
Chrome DevTools MCP server configured in `.codex/config.toml` for Codex or
`.mcp.json` for Claude Code.

1. Start a separate Chrome profile with remote debugging enabled on
   `http://127.0.0.1:9222`. Do not use a regular browsing profile. Use the
   command for the current operating system:

   ```bash
   # macOS
   open -na "Google Chrome" --args --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/private/tmp/chrome-debug-9222

   # Linux
   google-chrome --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug-9222
   ```

   On Windows PowerShell, run:

   ```powershell
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir="$env:TEMP\chrome-debug-9222"
   ```

2. Open the application and confirm that the target tab calls
   `setupDevToolWorker(...handlers)`.
3. Use `msw-dev-tool-browser tabs --cdp-url http://127.0.0.1:9222` to obtain the
   Browser CLI target ID. The Browser CLI target ID is not necessarily the same
   as a Chrome DevTools MCP page ID; do not substitute one for the other.
4. Use `@msw-dev-tool/browser-cli` for MSW handler and WebSocket mutations. Use
   Chrome DevTools MCP for navigation, DOM inspection, console/network inspection,
   and verifying the user-visible result.
5. After a mutation, inspect the same tab with Chrome DevTools MCP and verify the
   application behavior. Run `msw-dev-tool-browser reset --cdp-url
http://127.0.0.1:9222 --target <target-id>` when the scenario is no longer
   needed.

If the MCP server was added or its arguments changed, restart the MCP session
before using it. Keep the Chrome process running while both the MCP server and
Browser CLI are in use.
