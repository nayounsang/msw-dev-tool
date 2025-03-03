import React from "react";
import { flexRender } from "@tanstack/react-table";
import { useFlattenHandlersTable } from "../../hook/useFlattenHandlersTable";
import { useHandlerStore } from "../../lib/handlerStore";
import { Box, Button, Table } from "@radix-ui/themes";

export const HttpControl = () => {
  const table = useFlattenHandlersTable();
  const { resetMSWDevTool } = useHandlerStore();

  return (
    <Box>
      <Button onClick={() => resetMSWDevTool()}>Reset Dev tool</Button>
      <Table.Root onDragStart={(e) => e.stopPropagation()} style={{ userSelect: 'text' }}>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.ColumnHeaderCell key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id} align="center">
              {row.getVisibleCells().map((cell) => (
                <Table.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};
