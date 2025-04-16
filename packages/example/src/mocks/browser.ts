    import { handlers } from "./handlers";
    import { Handler, setupDevToolWorker } from "@msw-dev-tool/core";

    const _handlers = handlers as unknown as Handler[];

    export const worker = setupDevToolWorker(..._handlers);
