import { setupDevToolWorker } from "@msw-dev-tool/core";
import { handlers } from "./handlers";

export const worker = setupDevToolWorker(...handlers);
