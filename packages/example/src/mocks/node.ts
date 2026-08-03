import { Handler, setupDevToolServer } from "@msw-dev-tool/core/node";
import { handlers } from "./handlers";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const typedHandlers = handlers as unknown as Handler[];

let serverPromise: ReturnType<typeof setupDevToolServer> | null = null;

export const ensureMswServer = async () => {
  if (!serverPromise) {
    serverPromise = (async () => {
      const server = await setupDevToolServer(...typedHandlers);
      server.listen({ onUnhandledRequest: "bypass" });
      return server;
    })();
  }

  const server = await serverPromise;
  // Re-apply interception in case Next overwrote global fetch.
  server.listen({ onUnhandledRequest: "bypass" });
  return server;
};

export const startMswServer = ensureMswServer;
