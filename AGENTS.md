# Agent instructions

## Browser MCP workflow

When working with the browser version of MSW Dev Tool, use the project-local
Chrome DevTools MCP server.
Start a separate Chrome profile with remote debugging enabled on
   `http://127.0.0.1:9222`. Use the
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
