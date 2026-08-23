#!/usr/bin/env node
require("../dist/index.js")
  .runCli(process.argv.slice(2))
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
