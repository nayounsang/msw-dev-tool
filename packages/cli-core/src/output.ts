import type { JsonResult } from "./types";

export const printJson = (result: JsonResult): void => {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};
