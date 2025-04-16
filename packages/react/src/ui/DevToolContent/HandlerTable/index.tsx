import React from "react";
import { flexRender } from "@tanstack/react-table";
import { useFlattenHandlersTable } from "../hook/useFlattenHandlersTable";
import useUiControlStore from "../../../store/uiControlStore";
import { Flex } from "../../Components/Flex";
import clsx from "clsx";

export const HandlerTable = () => {
  const table = useFlattenHandlersTable();
  const { setDebuggerHandler } = useUiControlStore();
  const currentHandler = useUiControlStore((state) => state.currentHandler);

  return (
    <Flex className="flex-3 overflow-y-auto" direction="column" gap={4}>
      <p className="text-xl font-bold">Handlers</p>
      <table
        onDragStart={(e) => e.stopPropagation()}
        className="user-select-text w-full"
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ textAlign: "left", padding: "0.5rem" }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={clsx(
                "msw-dt-http-control-row",
                row.original.handler === currentHandler && "msw-dt-current-row",
                "cursor-pointer"
              )}
              onClick={() => {
                setDebuggerHandler(row.original.handler);
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={{ padding: "0.5rem" }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Flex>
  );
};
