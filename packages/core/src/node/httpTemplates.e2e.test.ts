import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  addSnapshotTempHandler,
  getSessionPathForPid,
  readSnapshotOrEmpty,
  setSnapshotBehavior,
  setSnapshotCustomResponse,
  HttpHandlerBehavior,
  MimeType,
  StringHttpStatusCode,
} from "./internal";

const childScript = `
  const readline = require("node:readline");
  const { http, HttpResponse } = require("msw");
  const { setupDevToolServer } = require(${JSON.stringify(
    path.resolve(__dirname, "../../dist/cjs/node/index.js"),
  )});
  (async () => {
    const server = await setupDevToolServer(
      http.get("http://node.test/code/:id", () => HttpResponse.json({ original: true })),
    );
    server.listen({ onUnhandledRequest: "bypass" });
    console.log(JSON.stringify({ ready: true, pid: process.pid }));
    readline.createInterface({ input: process.stdin }).on("line", async (line) => {
      const input = JSON.parse(line);
      try {
        const response = await fetch(input.url, input.init);
        console.log(JSON.stringify({
          status: response.status,
          body: await response.text(),
          requestId: response.headers.get("X-Request-ID"),
          queryHeader: response.headers.get("X-Query"),
          contentLength: response.headers.get("Content-Length"),
        }));
      } catch (error) {
        console.log(JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    });
  })().catch((error) => { console.error(error); process.exit(1); });
`;

const tempDirectories: string[] = [];

const waitForLine = (child: ChildProcessWithoutNullStreams) => {
  let buffer = "";
  const queued: string[] = [];
  let resolveNext: ((line: string) => void) | undefined;
  child.stdout.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      if (resolveNext) {
        const resolve = resolveNext;
        resolveNext = undefined;
        resolve(line);
      } else {
        queued.push(line);
      }
      newline = buffer.indexOf("\n");
    }
  });
  return () =>
    queued.length > 0
      ? Promise.resolve(queued.shift()!)
      : new Promise<string>((resolve) => {
          resolveNext = resolve;
        });
};

type ChildResponse = {
  status?: number;
  body?: string;
  requestId?: string | null;
  queryHeader?: string | null;
  contentLength?: string | null;
  error?: string;
};

const waitForResponse = async (
  child: ChildProcessWithoutNullStreams,
  nextLine: () => Promise<string>,
  input: { url: string; init?: RequestInit },
  isReady: (response: ChildResponse) => boolean,
  timeout = 5_000,
): Promise<ChildResponse> => {
  const deadline = Date.now() + timeout;
  let latest: ChildResponse = {};
  do {
    child.stdin.write(JSON.stringify(input) + "\n");
    latest = JSON.parse(await nextLine()) as ChildResponse;
    if (isReady(latest)) return latest;
    const remaining = deadline - Date.now();
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(50, remaining)));
    }
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for child response: ${JSON.stringify(latest)}`);
};

const startChild = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "msw-http-template-e2e-"));
  tempDirectories.push(directory);
  const child = spawn(process.execPath, ["-e", childScript], {
    cwd: directory,
    env: {
      ...process.env,
      NODE_PATH: path.resolve(__dirname, "../../../../node_modules"),
    },
    stdio: "pipe",
  });
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return { child, directory, nextLine: waitForLine(child) };
};

const stopChild = async (child: ChildProcessWithoutNullStreams) => {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => child.once("exit", () => resolve()));
};

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("HTTP template Node process E2E", () => {
  it("renders a custom response after an external snapshot update", async () => {
    const { child, directory, nextLine } = startChild();
    try {
      const ready = JSON.parse(await nextLine()) as { pid: number };
      const sessionPath = getSessionPathForPid(ready.pid, directory);
      const snapshot = await readSnapshotOrEmpty(sessionPath);
      const handlerId = snapshot.state.flattenHandlers[0]!.id;

      await setSnapshotCustomResponse(sessionPath, handlerId, {
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.OK,
        response: '{"id":"${{params.id}}","q":"${{request.query.q}}"}',
        header: '{"X-Request-ID":"${{requestId}}"}',
      });
      await setSnapshotBehavior(sessionPath, handlerId, HttpHandlerBehavior.CUSTOM_RESPONSE);
      const result = await waitForResponse(
        child,
        nextLine,
        { url: "http://node.test/code/9?q=a%22b" },
        (response) => response.status === 200 && response.body?.includes('"id":"9"') === true,
      );
      expect(result.status).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ id: "9", q: 'a"b' });
      expect(result.requestId).toBeTruthy();
    } finally {
      await stopChild(child);
    }
  }, 15_000);

  it("renders a temporary response after an external snapshot addition", async () => {
    const { child, directory, nextLine } = startChild();
    try {
      const ready = JSON.parse(await nextLine()) as { pid: number };
      const sessionPath = getSessionPathForPid(ready.pid, directory);
      await addSnapshotTempHandler(sessionPath, {
        path: "http://node.test/temp/:id",
        method: "post",
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.OK,
        response: '{"id":"${{params.id}}","body":${{request.body}}}',
      });
      const result = await waitForResponse(
        child,
        nextLine,
        {
          url: "http://node.test/temp/8",
          init: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ok: true }),
          },
        },
        (response) => response.status === 200 && response.body?.includes('"id":"8"') === true,
      );
      expect(result.status).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ id: "8", body: { ok: true } });
    } finally {
      await stopChild(child);
    }
  }, 15_000);

  it("parses a vendor JSON request body in a temporary response", async () => {
    const { child, directory, nextLine } = startChild();
    try {
      const ready = JSON.parse(await nextLine()) as { pid: number };
      const sessionPath = getSessionPathForPid(ready.pid, directory);
      await addSnapshotTempHandler(sessionPath, {
        path: "http://node.test/vendor-json",
        method: "post",
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.OK,
        response: '{"body":${{request.body}}}',
      });
      const result = await waitForResponse(
        child,
        nextLine,
        {
          url: "http://node.test/vendor-json",
          init: {
            method: "POST",
            headers: { "Content-Type": "application/problem+json; charset=utf-8" },
            body: JSON.stringify({ title: "Invalid request" }),
          },
        },
        (response) => response.status === 200 && response.body?.includes('"body"') === true,
      );
      expect(result.status).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ body: { title: "Invalid request" } });
    } finally {
      await stopChild(child);
    }
  }, 15_000);

  it("returns a response when a dynamic header contains encoded control characters", async () => {
    const { child, directory, nextLine } = startChild();
    try {
      const ready = JSON.parse(await nextLine()) as { pid: number };
      const sessionPath = getSessionPathForPid(ready.pid, directory);
      await addSnapshotTempHandler(sessionPath, {
        path: "http://node.test/header-template",
        method: "get",
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.OK,
        response: '{"ok":true}',
        header: '{"X-Query":"${{request.query.q}}"}',
      });
      const result = await waitForResponse(
        child,
        nextLine,
        { url: "http://node.test/header-template?q=before%0Aafter%00end" },
        (response) => response.status === 200 && response.queryHeader === "before after end",
      );
      expect(result.status).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ ok: true });
      expect(result.queryHeader).toBe("before after end");
    } finally {
      await stopChild(child);
    }
  }, 15_000);

  it("preserves unresolved tokens and static marker values in an escaped JSON response", async () => {
    const { child, directory, nextLine } = startChild();
    try {
      const ready = JSON.parse(await nextLine()) as { pid: number };
      const sessionPath = getSessionPathForPid(ready.pid, directory);
      await addSnapshotTempHandler(sessionPath, {
        path: "http://node.test/edge/:id",
        method: "post",
        contentType: MimeType.APPLICATION_JSON,
        status: StringHttpStatusCode.OK,
        response:
          '{"${{params.id}}":"${{request.query.value}}","body":${{request.body}},"missing":"${{params.missing}}","static":"__MSW_DEV_TOOL_TEMPLATE_0__"}',
      });

      const value = encodeURIComponent('quote " slash \\ line\n 한글');
      const result = await waitForResponse(
        child,
        nextLine,
        {
          url: `http://node.test/edge/8?value=${value}`,
          init: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ok: true }),
          },
        },
        (response) => response.status === 200 && response.body?.includes('"body"') === true,
      );
      expect(result.status).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        8: 'quote " slash \\ line\n 한글',
        body: { ok: true },
        missing: "${{params.missing}}",
        static: "__MSW_DEV_TOOL_TEMPLATE_0__",
      });
      expect(Number(result.contentLength)).toBe(Buffer.byteLength(result.body));
    } finally {
      await stopChild(child);
    }
  }, 15_000);
});
