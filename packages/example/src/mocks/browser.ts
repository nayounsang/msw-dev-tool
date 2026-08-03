import { setupDevToolWorker } from "@msw-dev-tool/core/browser";
import { handlers } from "./handlers";

export const workerPromise = setupDevToolWorker(...handlers);
