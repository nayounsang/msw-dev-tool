import { handlers } from "./handlers";
import { setupDevToolWorker } from "msw-dev-tool";

export const worker = setupDevToolWorker(...handlers);
