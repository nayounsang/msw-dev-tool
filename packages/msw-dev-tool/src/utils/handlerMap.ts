import { HttpHandler } from "msw";
import { HandlerMap } from "../lib";
import { RowSelectionState } from "@tanstack/react-table";

export interface FlatHandlerMap {
  url: string;
  method: string;
  handler: HttpHandler;
  checked: boolean;
}
export const flatHandlerMap = (handlerMap: HandlerMap): FlatHandlerMap[] => {
  return Object.entries(handlerMap).flatMap(([url, methods]) =>
    Object.entries(methods).map(([method, { handler, checked }]) => ({
      url,
      method,
      handler,
      checked,
    }))
  );
};

export const getRowId = (row: FlatHandlerMap) =>
  JSON.stringify({
    url: row.url,
    method: row.method,
  });

export const getObjFromRowId = (rowId: string) =>
  JSON.parse(rowId) as { url: string; method: string };

export const convertRowToRowSelectionState = (rows: FlatHandlerMap[]) => {
  return rows.reduce((acc, cur) => {
    acc[getRowId(cur)] = cur.checked;
    return acc;
  }, {} as RowSelectionState);
};
