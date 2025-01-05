import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { initDevToolHandlers } from "msw-dev-tool";

export const worker = setupWorker(...initDevToolHandlers(handlers));