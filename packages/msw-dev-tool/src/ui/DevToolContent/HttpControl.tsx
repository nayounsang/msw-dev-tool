import React from "react";
import { flexRender } from "@tanstack/react-table";
import { useFlattenHandlersTable } from "../../hook/useFlattenHandlersTable";
import { Flex, Heading, Table } from "@radix-ui/themes";
import useUiControlStore from "../../store/uiControlStore";

export const HttpControl = () => {
  const table = useFlattenHandlersTable();
  const { setDebuggerHandler } = useUiControlStore();

  return (
    <Flex
      style={{ flex: 3, overflowY: "auto" }}
      direction="column"
      gap="4"
    >
      <Heading as="h2" size="5">
        Handlers
      </Heading>
      <Table.Root
        onDragStart={(e) => e.stopPropagation()}
        style={{ userSelect: "text" }}
      >
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
            <Table.Row
              key={row.id}
              align="center"
              className="msw-dt-http-control-row"
              onClick={() => {
                setDebuggerHandler(row.original.handler);
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <Table.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
};
