import { Handler, setupDevToolWorker } from "@msw-dev-tool/core/browser";
import { handlers } from "./handlers";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const typedHandlers = handlers as unknown as Handler[];

export const workerPromise = setupDevToolWorker(...typedHandlers);
