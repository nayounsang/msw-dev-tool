import React from "react";
import { flexRender } from "@tanstack/react-table";
import { useFlattenHandlersTable } from "../../hook/useFlattenHandlersTable";
import { useHandlerStore } from "../../lib/handlerStore";

export const HttpControl = () => {
  const table = useFlattenHandlersTable();
  const { resetMSWDevTool } = useHandlerStore();

  return (
    <div>
      <button onClick={() => resetMSWDevTool()}>Reset Dev tool</button>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
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
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
