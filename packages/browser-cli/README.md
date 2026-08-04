# @msw-dev-tool/browser-cli

AI-oriented CLI for controlling a browser `msw-dev-tool` session over Chrome DevTools Protocol. Start Chrome with `--remote-debugging-port=9222` and a non-default `--user-data-dir` (for example, `--user-data-dir=/tmp/msw-dev-tool-chrome`), run `msw-dev-tool-browser tabs --cdp-url http://127.0.0.1:9222`, then pass the selected `--target` to the normal handler commands. The separate profile is required by current Chrome remote-debugging security restrictions and keeps the debugging session isolated from the user's regular browser profile.
