import React from "react";
import { flexRender } from "@tanstack/react-table";
import { useFlattenHandlersTable } from "../hook/useFlattenHandlersTable";
import { Flex } from "../../Components/Flex";

export const HandlerTable = () => {
  const table = useFlattenHandlersTable();
  
  return (
    <Flex className="overflow-y-auto" direction="column" gap={4}>
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
