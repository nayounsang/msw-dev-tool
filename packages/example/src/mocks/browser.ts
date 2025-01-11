import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { initMSWDevTool } from "msw-dev-tool";

export const worker = initMSWDevTool(setupWorker(...handlers));
