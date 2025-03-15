import { setupDevToolWorker } from "msw-dev-tool";
import { handlers } from "./handlers";

export const worker = setupDevToolWorker(...handlers);
