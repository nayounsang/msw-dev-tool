export type JsonResult = {
  ok: boolean;
  [key: string]: unknown;
};

export const printJson = (result: JsonResult): void => {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};
